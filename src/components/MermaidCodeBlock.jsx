import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Box, IconButton } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { useListModelsQuery } from '@/api/configurations.js';
import { useGenerateContentBlockingMutation } from '@/api/llm.js';
import { PUBLIC_PROJECT_ID } from '@/common/constants.js';
import { useCanvasEditSocket } from '@/hooks/chat/useCanvasSocket';
import useCopyDownloadHandlers from '@/hooks/chat/useCopyEventHandlers';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import { SERVICE_PROMPT_KEYS, useServicePromptByKey } from '@/hooks/useServicePromptByKey';
import useToast from '@/hooks/useToast';

import EditingPlaceholder from './Chat/EditingPlaceholder';
import { useCheckIsBlockEditing } from './CodeBlock';
import EditIcon from './Icons/EditIcon';
import { useShouldDisableEditCanvas } from './MarkdownTableBlock';
import MermaidDiagramOutput from './MermaidDiagramOutput/DiagramOutput';
import { getMermaidQuickFixModelInfo } from './MermaidDiagramOutput/mermaidQuickFixModel.helpers';
import { buildMermaidQuickFixPrompt } from './MermaidDiagramOutput/mermaidQuickFixPrompt';

const MermaidCodeBlock = ({
  markedToken,
  theme,
  onEdit,
  startPos,
  endPos,
  selectedCodeBlockInfo,
  canvasId,
  messageItemId,
  isStreaming,
  showToolbar,
}) => {
  const { toastError, toastInfo } = useToast();
  const { isBlockEditing, blockId } = useCheckIsBlockEditing(canvasId, selectedCodeBlockInfo);
  const shouldDisableEdit = useShouldDisableEditCanvas(isStreaming);

  const projectId = useSelectedProjectId();
  const { sendChangeToRemote } = useCanvasEditSocket();
  const diagramContainerRef = useRef(null);
  const pendingScrollRestoreRef = useRef(null);
  const [fixedCode, setFixedCode] = useState('');
  const [generateContentBlocking, { isLoading: isQuickFixLoading }] = useGenerateContentBlockingMutation();

  const { data: modelsData = {} } = useListModelsQuery(
    { projectId, include_shared: projectId != PUBLIC_PROJECT_ID, section: 'llm' },
    { skip: !projectId },
  );

  const { prompt: quickFixBasePrompt, isLoading: isServicePromptLoading } = useServicePromptByKey(
    projectId,
    SERVICE_PROMPT_KEYS.MERMAID_QUICK_FIX,
  );

  const quickFixModelInfo = useMemo(() => {
    return getMermaidQuickFixModelInfo(modelsData);
  }, [modelsData]);

  const displayedCode = fixedCode || markedToken.text;
  const onCopy = useCallback(async () => {
    await navigator.clipboard.writeText(displayedCode);
    toastInfo('The code has been copied into clipboard');
  }, [displayedCode, toastInfo]);
  const { onClickCopy } = useCopyDownloadHandlers({ onCopy });

  const onClickEdit = useCallback(() => {
    onEdit?.({
      rawData: markedToken.raw,
      codeBlock: displayedCode,
      language: 'mermaid',
      isBlock: true,
      startPos,
      endPos,
      canvasId,
      messageItemId,
      blockId,
    });
  }, [onEdit, markedToken.raw, displayedCode, startPos, endPos, canvasId, messageItemId, blockId]);

  const getScrollableAncestor = useCallback(element => {
    if (!element) return document.scrollingElement || document.documentElement;

    let parent = element.parentElement;
    while (parent) {
      const style = window.getComputedStyle(parent);
      const overflowY = style.overflowY;
      const isScrollable =
        (overflowY === 'auto' || overflowY === 'scroll') && parent.scrollHeight > parent.clientHeight;
      if (isScrollable) {
        return parent;
      }
      parent = parent.parentElement;
    }

    return document.scrollingElement || document.documentElement;
  }, []);

  const extractMermaidCode = useCallback(text => {
    if (!text) return '';
    const raw = String(text).trim();

    const fencedMermaid = raw.match(/```mermaid\s*([\s\S]*?)```/i);
    if (fencedMermaid?.[1]) {
      return fencedMermaid[1].trim();
    }

    const fencedAny = raw.match(/```\s*([\s\S]*?)```/);
    if (fencedAny?.[1]) {
      return fencedAny[1].trim();
    }

    return raw;
  }, []);

  const extractPredictText = useCallback(response => {
    const result = response?.result ?? response;

    if (typeof result === 'string') return result;
    if (!result) return '';

    const coerceContentToText = value => {
      if (typeof value === 'string') return value;
      if (Array.isArray(value)) {
        return value.map(part => part?.text || part?.content || '').join('');
      }
      return '';
    };

    const extractLastChatHistoryText = chatHistory => {
      if (!Array.isArray(chatHistory) || chatHistory.length === 0) return '';

      for (let index = chatHistory.length - 1; index >= 0; index -= 1) {
        const msg = chatHistory[index];
        const role = msg?.role || msg?.type;
        const contentText = coerceContentToText(msg?.content ?? msg);

        if (!contentText) continue;

        if (role === 'assistant' || role === 'ai') {
          return contentText;
        }
      }

      const fallback = chatHistory[chatHistory.length - 1];
      return coerceContentToText(fallback?.content ?? fallback);
    };

    const extractLastThinkingStepText = thinkingSteps => {
      if (!Array.isArray(thinkingSteps) || thinkingSteps.length === 0) return '';
      for (let index = thinkingSteps.length - 1; index >= 0; index -= 1) {
        const step = thinkingSteps[index];
        const text = coerceContentToText(step?.text ?? step);
        if (text) return text;
      }
      return '';
    };

    if (typeof result.elitea_response === 'string') return result.elitea_response;
    if (typeof result.output === 'string') return result.output;

    const chatHistoryText = extractLastChatHistoryText(result.chat_history);
    if (chatHistoryText) return chatHistoryText;

    const thinkingText = extractLastThinkingStepText(result.thinking_steps);
    if (thinkingText) return thinkingText;

    const messages = result.messages;
    if (Array.isArray(messages) && messages.length > 0) {
      const last = messages[messages.length - 1];
      if (typeof last === 'string') return last;
      if (typeof last?.content === 'string') return last.content;
      if (Array.isArray(last?.content)) {
        return last.content.map(part => part?.text || '').join('');
      }
    }

    try {
      return JSON.stringify(result);
    } catch {
      return String(result);
    }
  }, []);

  const handleQuickFix = useCallback(
    async ({ error, code }) => {
      if (!projectId) {
        toastError('Select a project to use Quick Fix');
        return;
      }

      if (!quickFixModelInfo?.modelName || !quickFixModelInfo?.modelProjectId) {
        toastError('No model is available for Quick Fix');
        return;
      }

      if (isServicePromptLoading) {
        toastInfo('Loading Service Prompt…');
        return;
      }

      if (!quickFixBasePrompt) {
        toastError('Service Prompt is not configured');
        return;
      }

      const container = diagramContainerRef.current;
      const scrollable = getScrollableAncestor(container);
      const beforeTop = container?.getBoundingClientRect?.().top;
      if (container && typeof beforeTop === 'number') {
        pendingScrollRestoreRef.current = { scrollable, beforeTop };
      }

      const prompt = buildMermaidQuickFixPrompt({ basePrompt: quickFixBasePrompt, error, code });

      try {
        const response = await generateContentBlocking({
          projectId,
          user_input: prompt,
          chat_history: [],
          tools: [],
          instructions: null,
          llm_settings: {
            model_name: quickFixModelInfo.modelName,
            model_project_id: quickFixModelInfo.modelProjectId,
            temperature: 0.1,
          },
          await_task_timeout: 60,
        }).unwrap();

        if (response?.task_id) {
          toastError('Quick Fix is taking longer than expected. Please try again.');
          return;
        }

        const text = extractPredictText(response);
        const newCode = extractMermaidCode(text);

        if (!newCode) {
          toastError('Quick Fix did not return Mermaid code');
          return;
        }

        setFixedCode(newCode);

        if (canvasId) {
          sendChangeToRemote(canvasId, newCode);
        }
      } catch (e) {
        toastError(e?.data?.error || e?.message || 'Quick Fix failed');
      }
    },
    [
      extractMermaidCode,
      extractPredictText,
      canvasId,
      generateContentBlocking,
      getScrollableAncestor,
      isServicePromptLoading,
      projectId,
      quickFixBasePrompt,
      quickFixModelInfo,
      sendChangeToRemote,
      toastError,
      toastInfo,
    ],
  );

  useEffect(() => {
    if (!pendingScrollRestoreRef.current) return;

    const container = diagramContainerRef.current;
    if (!container) {
      pendingScrollRestoreRef.current = null;
      return;
    }

    const { scrollable, beforeTop } = pendingScrollRestoreRef.current;
    pendingScrollRestoreRef.current = null;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const afterTop = container.getBoundingClientRect().top;
        const delta = afterTop - beforeTop;
        if (!delta) return;

        const scrollingElement = document.scrollingElement || document.documentElement;
        if (
          scrollable === scrollingElement ||
          scrollable === document.body ||
          scrollable === document.documentElement
        ) {
          window.scrollBy(0, delta);
        } else {
          scrollable.scrollTop += delta;
        }
      });
    });
  }, [fixedCode]);

  return !isBlockEditing ? (
    <>
      <Box
        sx={{
          width: '100%',
          display: showToolbar ? 'flex' : 'none',
          flexDirection: 'row',
          justifyContent: 'flex-end',
          alignItems: 'center',
          padding: '8px 0px 8px 8px',
          gap: '8px',
        }}
      >
        {onEdit && (
          <Tooltip
            title="Edit diagram"
            placement="top"
          >
            <span>
              <IconButton
                variant="alita"
                color="tertiary"
                disabled={shouldDisableEdit}
                sx={{
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onClick={onClickEdit}
              >
                <EditIcon
                  sx={{ fontSize: 16 }}
                  fill={
                    !shouldDisableEdit ? theme.palette.icon.fill.default : theme.palette.icon.fill.disabled
                  }
                />
              </IconButton>
            </span>
          </Tooltip>
        )}
        <Tooltip
          title="Copy code"
          placement="top"
        >
          <IconButton
            variant="alita"
            color="tertiary"
            sx={{
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              marginLeft: '0px',
            }}
            onClick={onClickCopy}
          >
            <ContentCopyIcon sx={{ fontSize: '16px', color: theme.palette.icon.fill.default }} />
          </IconButton>
        </Tooltip>
      </Box>
      <Box
        ref={diagramContainerRef}
        sx={{ width: '100%', overflowX: 'scroll', height: '500px' }}
      >
        <MermaidDiagramOutput
          code={displayedCode}
          key={theme.palette.mode}
          onQuickFix={handleQuickFix}
          isQuickFixLoading={isQuickFixLoading}
          quickFixTooltip={quickFixModelInfo?.tooltip || ''}
        />
      </Box>
    </>
  ) : (
    <EditingPlaceholder title="Diagram editing..." />
  );
};

export default MermaidCodeBlock;
