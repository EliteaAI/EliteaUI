import { useCallback, useMemo } from 'react';

import { MermaidQuickFixHelpers } from '@/[fsd]/shared/lib/helpers';
import { useListModelsQuery } from '@/api/configurations.js';
import { useGenerateContentBlockingMutation } from '@/api/llm.js';
import { PUBLIC_PROJECT_ID } from '@/common/constants';
import { getMermaidQuickFixModelInfo } from '@/components/MermaidDiagramOutput/mermaidQuickFixModel.helpers';
import { buildMermaidQuickFixPrompt } from '@/components/MermaidDiagramOutput/mermaidQuickFixPrompt';

import { useSelectedProjectId } from './useSelectedProject.hooks';
import { SERVICE_PROMPT_KEYS, useServicePromptByKey } from './useServicePromptByKey.hooks';
import { useToast } from './useToast.hooks';

/**
 * Shared Quick Fix flow for a Mermaid diagram: picks the model, loads the service prompt, asks the model
 * for a corrected diagram and hands the result to the caller.
 *
 * - `readOnly`: blocks the fix, e.g. while someone else is editing the canvas.
 * - `onBeforeRequest`: runs once the prompt is ready, right before the model request.
 * - `onFixed(newCode)`: receives the corrected diagram code.
 */
export const useMermaidQuickFix = props => {
  const { readOnly = false, onBeforeRequest, onFixed } = props || {};
  const { toastError, toastInfo } = useToast();
  const projectId = useSelectedProjectId();
  const [generateContentBlocking, { isLoading: isQuickFixLoading }] = useGenerateContentBlockingMutation();

  const { data: modelsData = {} } = useListModelsQuery(
    { projectId, include_shared: projectId != PUBLIC_PROJECT_ID, section: 'llm' },
    { skip: !projectId },
  );

  const { isLoading: isServicePromptLoading, ensurePrompt: ensureServicePrompt } = useServicePromptByKey(
    projectId,
    SERVICE_PROMPT_KEYS.MERMAID_QUICK_FIX,
  );

  const quickFixModelInfo = useMemo(() => getMermaidQuickFixModelInfo(modelsData), [modelsData]);

  const handleQuickFix = useCallback(
    async ({ error, code }) => {
      if (readOnly) {
        toastError('Diagram is read-only right now');
        return;
      }

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

      const { prompt: basePrompt, error: servicePromptError } = await ensureServicePrompt();
      if (!basePrompt) {
        toastError(
          servicePromptError
            ? 'Failed to load the Service Prompt. Please try again.'
            : 'Service Prompt is not configured',
        );
        return;
      }

      onBeforeRequest?.();

      try {
        const response = await generateContentBlocking({
          projectId,
          user_input: buildMermaidQuickFixPrompt({ basePrompt, error, code }),
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

        const { extractMermaidCode, extractPredictText } = MermaidQuickFixHelpers;
        const newCode = extractMermaidCode(extractPredictText(response));

        if (!newCode) {
          toastError('Quick Fix did not return Mermaid code');
          return;
        }

        onFixed?.(newCode);
      } catch (e) {
        toastError(e?.data?.error || e?.message || 'Quick Fix failed');
      }
    },
    [
      ensureServicePrompt,
      generateContentBlocking,
      isServicePromptLoading,
      onBeforeRequest,
      onFixed,
      projectId,
      quickFixModelInfo,
      readOnly,
      toastError,
      toastInfo,
    ],
  );

  return {
    handleQuickFix,
    isQuickFixLoading,
    quickFixTooltip: quickFixModelInfo?.tooltip || '',
  };
};
