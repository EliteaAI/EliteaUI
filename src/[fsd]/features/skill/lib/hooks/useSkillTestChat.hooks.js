import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { v4 as uuidv4 } from 'uuid';

import { useConversationCreateMutation } from '@/api';
import { SocketMessageType, sioEvents } from '@/common/constants';
import useSocket, { useManualSocket } from '@/hooks/useSocket';

const convertContent = content => {
  if (content == null) return '';
  if (typeof content === 'string') return content;
  return JSON.stringify(content);
};

// Grace window after an intermediate AgentLlmEnd to allow a trailing AgentResponse
// before finalizing on the chunk-assembled content.
const FINALIZE_AFTER_LLM_END_MS = 4000;

export const useSkillTestChat = ({ projectId, instructions, selectedModel, llmSettings }) => {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const [createConversation] = useConversationCreateMutation();

  const { emit: emitEnterRoom } = useManualSocket(sioEvents.chat_enter_room);
  const { emit: emitLeaveRoom } = useManualSocket(sioEvents.chat_leave_rooms);

  const conversationRef = useRef(null);
  const conversationKeyRef = useRef(null);

  const activeStreamIdRef = useRef(null);
  const activeAssistantIdRef = useRef(null);
  const activeMessageIdRef = useRef(null);
  const finalizeTimerRef = useRef(null);

  const conversationKey = useMemo(
    () => `${instructions || ''}::${selectedModel?.name || ''}::${selectedModel?.project_id ?? ''}`,
    [instructions, selectedModel?.name, selectedModel?.project_id],
  );

  const updateAssistant = useCallback((patch, append = false) => {
    const id = activeAssistantIdRef.current;
    if (!id) return;
    setMessages(prev =>
      prev.map(m =>
        m.id === id
          ? {
              ...m,
              ...patch,
              content: append ? m.content + (patch.content || '') : (patch.content ?? m.content),
            }
          : m,
      ),
    );
  }, []);

  const finalize = useCallback(() => {
    clearTimeout(finalizeTimerRef.current);
    finalizeTimerRef.current = null;
    activeStreamIdRef.current = null;
    activeAssistantIdRef.current = null;
    activeMessageIdRef.current = null;
    setIsStreaming(false);
  }, []);

  const handleSocketEvent = useCallback(
    message => {
      const { type, stream_id, message_id, content, response_metadata } = message || {};
      // The LLM/dummy chat stream emits into room_chat_predict_<conversation_uuid>,
      // so every event for our run carries stream_id === conversation_uuid.
      if (!activeStreamIdRef.current || stream_id !== activeStreamIdRef.current) return;
      if (message_id) {
        if (activeMessageIdRef.current == null) activeMessageIdRef.current = message_id;
        else if (activeMessageIdRef.current !== message_id) return;
      }

      switch (type) {
        case SocketMessageType.StartTask:
          setIsStreaming(true);
          break;
        case SocketMessageType.Chunk:
        case SocketMessageType.AIMessageChunk:
        case SocketMessageType.AgentLlmChunk:
          updateAssistant({ content: convertContent(content) }, true);
          if (response_metadata?.finish_reason) finalize();
          break;
        case SocketMessageType.AgentResponse:
          // Authoritative final text — replaces chunk-assembled content.
          updateAssistant({ content: convertContent(content) });
          finalize();
          break;
        case SocketMessageType.AgentLlmEnd:
          // Intermediate end; keep alive briefly in case AgentResponse follows,
          // otherwise finalize on the chunk-assembled content.
          clearTimeout(finalizeTimerRef.current);
          finalizeTimerRef.current = setTimeout(() => {
            if (activeStreamIdRef.current) finalize();
          }, FINALIZE_AFTER_LLM_END_MS);
          break;
        case SocketMessageType.AgentException:
        case SocketMessageType.Error:
        case SocketMessageType.LlmError: {
          const err = content?.error || content || 'Test run failed';
          const errStr = typeof err === 'string' ? err : JSON.stringify(err);
          updateAssistant({ content: errStr, error: true });
          finalize();
          break;
        }
        default:
          break;
      }
    },
    [updateAssistant, finalize],
  );

  const { emit: socketEmit } = useSocket(sioEvents.chat_predict, handleSocketEvent);

  useEffect(() => {
    const leaveRoom = emitLeaveRoom;
    return () => {
      clearTimeout(finalizeTimerRef.current);
      const conversation = conversationRef.current;
      if (conversation?.id) {
        leaveRoom({
          conversation_id: conversation.id,
          conversation_uuid: conversation.uuid,
          project_id: projectId,
        });
      }
    };
  }, [emitLeaveRoom, projectId]);

  const ensureConversation = useCallback(async () => {
    if (conversationRef.current && conversationKeyRef.current === conversationKey) {
      return conversationRef.current;
    }

    if (conversationRef.current?.id) {
      emitLeaveRoom({
        conversation_id: conversationRef.current.id,
        conversation_uuid: conversationRef.current.uuid,
        project_id: projectId,
      });
    }

    const result = await createConversation({
      is_private: true,
      name: `Skill test: ${uuidv4().slice(0, 8)}`,
      source: 'chat',
      instructions: instructions || '',
      meta: {},
      participants: [],
      projectId,
    });

    if (!result?.data) {
      throw new Error('Failed to create test conversation');
    }

    conversationRef.current = result.data;
    conversationKeyRef.current = conversationKey;
    return result.data;
  }, [conversationKey, createConversation, emitLeaveRoom, instructions, projectId]);

  const send = useCallback(
    async text => {
      // Drop any pending finalize timer from a previous run before starting a new one.
      clearTimeout(finalizeTimerRef.current);

      const conversation = await ensureConversation();

      // Join the conversation room so streamed chat_predict events reach the browser.
      emitEnterRoom({
        conversation_id: conversation.id,
        conversation_uuid: conversation.uuid,
        project_id: projectId,
      });

      const assistantId = uuidv4();
      activeStreamIdRef.current = conversation.uuid;
      activeAssistantIdRef.current = assistantId;
      activeMessageIdRef.current = null;
      setIsStreaming(true);
      setMessages(prev => [
        ...prev,
        { id: uuidv4(), role: 'user', content: text },
        { id: assistantId, role: 'assistant', content: '' },
      ]);

      const ok = socketEmit({
        project_id: projectId,
        conversation_uuid: conversation.uuid,
        user_input: text,
        question_id: uuidv4(),
        interaction_uuid: uuidv4(),
        llm_settings: {
          model_name: selectedModel?.name,
          model_project_id: selectedModel?.project_id,
          temperature: llmSettings?.temperature,
          max_tokens: llmSettings?.max_tokens,
        },
      });

      if (!ok) {
        updateAssistant(
          { content: 'Socket connection not available. Please retry in a moment.', error: true },
          false,
        );
        finalize();
      }
    },
    [
      ensureConversation,
      emitEnterRoom,
      finalize,
      llmSettings,
      projectId,
      selectedModel,
      socketEmit,
      updateAssistant,
    ],
  );

  return {
    messages,
    isStreaming,
    send,
  };
};
