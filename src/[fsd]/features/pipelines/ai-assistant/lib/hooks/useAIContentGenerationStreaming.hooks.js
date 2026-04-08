import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { v4 as uuidv4 } from 'uuid';

import {
  buildFieldContextPrompt,
  getServicePromptKeyForFieldName,
} from '@/[fsd]/features/pipelines/ai-assistant/lib/constants/promptTemplates';
import { useGetAvailableConfigurationsTypeQuery } from '@/api/configurations';
import { useGenerateContentStreamingMutation, useStopLlmTaskMutation } from '@/api/llm';
import { SocketMessageType, sioEvents } from '@/common/constants';
import SocketContext from '@/contexts/SocketContext';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import { useServicePromptByKey } from '@/hooks/useServicePromptByKey';
import { useManualSocket } from '@/hooks/useSocket';
import useToast from '@/hooks/useToast';

/**
 * Extracts the backend-shipped Service Prompt defaults from the
 * `/configurations/available` schema response (RTK query: `getAvailableConfigurationsType`).
 *
 * We use these defaults as a fallback when a Service Prompt configuration is not created yet,
 * so prompt text is sourced from backend in all cases (no UI hardcoding).
 *
 * Expected schema shape (simplified):
 * `availableTypes[].config_schema.properties.data.properties.prompt.default_by_key`
 *
 * @param {Array<any> | undefined | null} availableTypes
 * @returns {Record<string, string>} map: service_prompt_key -> default prompt text
 */
const getServicePromptDefaultsByKey = availableTypes => {
  const schema = (availableTypes || []).find(item => item?.type === 'service_prompt')?.config_schema;
  const defaults = schema?.properties?.data?.properties?.prompt?.default_by_key;

  if (defaults && typeof defaults === 'object') {
    return defaults;
  }

  return {};
};

export const useAIContentGenerationStreaming = ({
  modelConfig,
  fieldName,
  stateVariablesInfo = '',
  availableNodesInfo = '',
}) => {
  const projectId = useSelectedProjectId();

  const servicePromptKey = getServicePromptKeyForFieldName(fieldName);
  const { prompt: promptFromConfig } = useServicePromptByKey(projectId, servicePromptKey);
  const { data: availableTypes } = useGetAvailableConfigurationsTypeQuery(
    { section: 'service_prompts' },
    { skip: !servicePromptKey },
  );

  const defaultPromptsByKey = useMemo(() => {
    return getServicePromptDefaultsByKey(availableTypes);
  }, [availableTypes]);

  const basePromptOverride = useMemo(() => {
    if (promptFromConfig?.trim()) return promptFromConfig;
    const fallback = defaultPromptsByKey?.[servicePromptKey];
    return typeof fallback === 'string' ? fallback : '';
  }, [defaultPromptsByKey, promptFromConfig, servicePromptKey]);

  const socket = useContext(SocketContext);
  const [generateContentMutation] = useGenerateContentStreamingMutation();
  const [stopLlmTask] = useStopLlmTaskMutation();
  const { toastError } = useToast();

  const [streamedContent, setStreamedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasError, setHasError] = useState(false);

  const activeStreamIdRef = useRef(null);
  const genTokenRef = useRef(0);
  const toastErrorRef = useRef(toastError);
  const chunkBufferRef = useRef([]);
  const rafPendingRef = useRef(false);
  const finalizeTimerRef = useRef(null);

  useEffect(() => {
    toastErrorRef.current = toastError;
  }, [toastError]);

  const resetContent = useCallback(() => {
    chunkBufferRef.current = [];
    setStreamedContent('');
    setHasError(false);
  }, []);

  const checkAndSetError = useCallback(content => {
    if (content && content.trimStart().startsWith('Error')) {
      setHasError(true);
    }
  }, []);

  const flushBuffered = useCallback(() => {
    if (rafPendingRef.current) return;
    rafPendingRef.current = true;

    requestAnimationFrame(() => {
      rafPendingRef.current = false;
      if (!chunkBufferRef.current.length) return;

      const merged = chunkBufferRef.current.join('');
      chunkBufferRef.current = [];
      setStreamedContent(prev => prev + merged);
    });
  }, []);

  const finalize = useCallback(() => {
    setIsGenerating(false);
    activeStreamIdRef.current = null;
    clearTimeout(finalizeTimerRef.current);
    finalizeTimerRef.current = null;

    // Flush any remaining chunks and check for errors
    const remaining = chunkBufferRef.current.join('');
    chunkBufferRef.current = [];

    setStreamedContent(prev => {
      const finalContent = prev + remaining;
      checkAndSetError(finalContent);
      return finalContent;
    });
  }, [checkAndSetError]);

  const flushAndKeepAlive = useCallback(() => {
    const remaining = chunkBufferRef.current.join('');
    chunkBufferRef.current = [];

    setStreamedContent(prev => prev + remaining);

    clearTimeout(finalizeTimerRef.current);
    finalizeTimerRef.current = setTimeout(() => {
      if (activeStreamIdRef.current) {
        finalize();
      }
    }, 5000);
  }, [finalize]);

  const handleSocketEvent = useCallback(
    message => {
      const { type: socketMessageType, stream_id, response_metadata } = message || {};
      const activeId = activeStreamIdRef.current;
      if (!activeId || stream_id !== activeId) return;

      const convertContent = content => {
        if (content == null) return '';
        if (typeof content === 'string') return content;
        return JSON.stringify(content);
      };

      switch (socketMessageType) {
        case SocketMessageType.StartTask:
          setIsGenerating(true);
          break;
        case SocketMessageType.Chunk:
        case SocketMessageType.AIMessageChunk:
        case SocketMessageType.AgentLlmChunk: {
          const chunk = convertContent(message.content);
          if (chunk) {
            chunkBufferRef.current.push(chunk);
            flushBuffered();
          }
          if (response_metadata?.finish_reason) finalize();
          break;
        }
        case SocketMessageType.AgentResponse: {
          // Final content from agent — replaces chunk-assembled text
          const finalText = convertContent(message.content);
          chunkBufferRef.current = [];
          setStreamedContent(finalText);
          checkAndSetError(finalText);
          finalize();
          break;
        }
        case SocketMessageType.AgentLlmEnd:
          // Intermediate event — flush chunks but keep stream alive for AgentResponse
          flushAndKeepAlive();
          break;
        case SocketMessageType.Error:
        case SocketMessageType.LlmError: {
          const err = message.content?.error || message.content || 'Failed to generate content';
          const errStr = typeof err === 'string' ? err : JSON.stringify(err);
          toastErrorRef.current?.(errStr);
          setHasError(true);
          finalize();
          break;
        }
        default:
          break;
      }
    },
    [flushBuffered, finalize, checkAndSetError, flushAndKeepAlive],
  );

  const { subscribe, unsubscribe } = useManualSocket(sioEvents.application_predict, handleSocketEvent);

  useEffect(() => {
    subscribe();
    return () => {
      unsubscribe();
      clearTimeout(finalizeTimerRef.current);
      finalizeTimerRef.current = null;
    };
  }, [subscribe, unsubscribe]);

  const cancel = useCallback(() => {
    const streamId = activeStreamIdRef.current;

    if (streamId) {
      stopLlmTask({ projectId, task_id: streamId })
        .unwrap()
        .catch(() => {});
    }

    activeStreamIdRef.current = null;
    setIsGenerating(false);
    chunkBufferRef.current = [];
    clearTimeout(finalizeTimerRef.current);
    finalizeTimerRef.current = null;
  }, [projectId, stopLlmTask]);

  const generateContent = useCallback(
    async (userPrompt, currentContent = '') => {
      if (!userPrompt?.trim()) return null;
      if (!socket?.id) {
        toastError('Socket connection not available');
        return null;
      }
      if (!modelConfig?.model_name) {
        toastError('No LLM model configured. Please configure a model in the pipeline settings.');
        return null;
      }

      try {
        resetContent();
        const streamId = uuidv4();
        const messageId = uuidv4();

        // Build field-specific prompt using template if available
        const fullPrompt = buildFieldContextPrompt(
          userPrompt,
          fieldName,
          currentContent,
          stateVariablesInfo,
          availableNodesInfo,
          { basePromptOverride },
        );

        activeStreamIdRef.current = streamId;
        genTokenRef.current += 1;
        const myToken = genTokenRef.current;
        setIsGenerating(true);
        const payload = {
          projectId,
          sid: socket.id,
          message_id: messageId,
          stream_id: streamId,
          user_input: fullPrompt,
          chat_history: [],
          llm_settings: {
            model_name: modelConfig.model_name,
            integration_uid: modelConfig.integration_uid,
            temperature: modelConfig.temperature ?? 0.7,
            max_tokens: modelConfig.max_tokens ?? 1024,
          },
        };

        const result = await generateContentMutation(payload).unwrap();
        if (result?.error) throw new Error(result.error);
        if (genTokenRef.current !== myToken) return null; // Race protection
        return null;
      } catch (err) {
        const msg = err?.data?.error || err?.message || 'Failed to generate content';
        toastError(msg);
        cancel();
        return null;
      }
    },
    [
      projectId,
      modelConfig,
      generateContentMutation,
      toastError,
      socket?.id,
      resetContent,
      cancel,
      fieldName,
      stateVariablesInfo,
      availableNodesInfo,
      basePromptOverride,
    ],
  );

  return {
    generateContent,
    cancel,
    isGenerating,
    streamedContent,
    hasError,
    resetContent,
    get currentStreamId() {
      return activeStreamIdRef.current;
    },
  };
};
