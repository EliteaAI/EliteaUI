import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useGeneratePipelineNodeDraftMutation } from '@/[fsd]/features/pipelines/node-ai-draft/api/nodeDraftApi';
import { useToast } from '@/[fsd]/shared/lib/hooks';

export const NODE_DRAFT_STEPS = {
  requirement: 'requirement',
  generating: 'generating',
  review: 'review',
  error: 'error',
};

export const REQUIREMENT_MAX_LENGTH = 2000;

const GENERIC_ERROR = 'Something went wrong. Try again.';
const MODEL_HINT = 'Choose another model in the pipeline settings.';
const RETRYABLE_STATUSES = [422, 500, 503, 504];
const MODEL_ERROR_CODES = ['model_unavailable', 'no_model'];

const isAbort = error => error?.name === 'AbortError' || error?.error === 'AbortError';

const toError = error => {
  const message = error?.data?.error || GENERIC_ERROR;
  const isModelError = MODEL_ERROR_CODES.includes(error?.data?.code);
  return {
    message: isModelError ? `${message} ${MODEL_HINT}` : message,
    canRetry:
      !isModelError && (typeof error?.status !== 'number' || RETRYABLE_STATUSES.includes(error.status)),
  };
};

const toDraft = response => ({
  summary: response.summary || '',
  node: response.node,
  changedPaths: response.changed_paths || [],
  attachments: response.attachments || [],
  newState: (response.new_state || []).map(variable => ({ ...variable, checked: true })),
  warnings: response.warnings || [],
});

/**
 * Generate → review state of one node draft. The request is aborted on Stop and when the modal unmounts;
 * only one request runs at a time (AC-10, AC-29a, AC-29b).
 */
export const useNodeAiDraft = options => {
  const { projectId, applicationId, versionId, mode, node, pipelineYaml, llmSettings } = options;
  const [generateDraft] = useGeneratePipelineNodeDraftMutation();
  const { toastInfo } = useToast();

  const [step, setStep] = useState(NODE_DRAFT_STEPS.requirement);
  const [requirement, setRequirementState] = useState('');
  const [draft, setDraft] = useState(null);
  // Bumped on every new draft, even one with the same content, so the modal can reset what belongs to the old one
  const [draftVersion, setDraftVersion] = useState(0);
  const [isDraftEdited, setIsDraftEdited] = useState(false);
  const [error, setError] = useState(null);
  const requestRef = useRef(null);
  const stoppedRef = useRef(false);

  useEffect(() => () => requestRef.current?.abort(), []);

  const setRequirement = useCallback(
    value => setRequirementState(value.slice(0, REQUIREMENT_MAX_LENGTH)),
    [],
  );

  const run = useCallback(
    async (extra, returnStep) => {
      if (requestRef.current) return;
      stoppedRef.current = false;
      setError(null);
      setStep(NODE_DRAFT_STEPS.generating);
      const pending = generateDraft({
        projectId,
        application_id: applicationId,
        version_id: versionId,
        node_id: node?.id,
        node_type: node?.type,
        mode,
        requirement: requirement.trim(),
        current_node: node,
        pipeline_yaml: pipelineYaml,
        llm_settings: llmSettings,
        ...extra,
      });
      requestRef.current = pending;
      try {
        const response = await pending.unwrap();
        setDraft(toDraft(response));
        setDraftVersion(version => version + 1);
        setIsDraftEdited(false);
        setStep(NODE_DRAFT_STEPS.review);
      } catch (caught) {
        if (stoppedRef.current || isAbort(caught)) {
          setStep(returnStep);
        } else {
          setError(toError(caught));
          setStep(NODE_DRAFT_STEPS.error);
        }
      } finally {
        requestRef.current = null;
      }
    },
    [generateDraft, projectId, applicationId, versionId, node, mode, requirement, pipelineYaml, llmSettings],
  );

  const generate = useCallback(() => run({}, NODE_DRAFT_STEPS.requirement), [run]);
  const regenerate = generate;

  const stop = useCallback(() => {
    if (!requestRef.current) return;
    stoppedRef.current = true;
    requestRef.current.abort();
    toastInfo('Generation stopped.');
  }, [toastInfo]);

  const back = useCallback(() => setStep(NODE_DRAFT_STEPS.requirement), []);

  const updateDraftNode = useCallback(nextNode => {
    setDraft(prev => (prev ? { ...prev, node: nextNode } : prev));
    setIsDraftEdited(true);
  }, []);

  const toggleNewState = useCallback(name => {
    setDraft(prev =>
      prev
        ? {
            ...prev,
            newState: prev.newState.map(item =>
              item.name === name ? { ...item, checked: !item.checked } : item,
            ),
          }
        : prev,
    );
  }, []);

  return useMemo(
    () => ({
      step,
      requirement,
      setRequirement,
      charactersLeft: REQUIREMENT_MAX_LENGTH - requirement.length,
      canGenerate: Boolean(requirement.trim()) && step !== NODE_DRAFT_STEPS.generating,
      draft,
      draftVersion,
      hasDraft: Boolean(draft),
      isDraftEdited,
      error,
      generate,
      regenerate,
      stop,
      back,
      updateDraftNode,
      toggleNewState,
    }),
    [
      step,
      requirement,
      setRequirement,
      draft,
      draftVersion,
      isDraftEdited,
      error,
      generate,
      regenerate,
      stop,
      back,
      updateDraftNode,
      toggleNewState,
    ],
  );
};
