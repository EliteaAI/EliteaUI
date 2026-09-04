import { useCallback, useEffect, useRef, useState } from 'react';

import { useLazyApplicationDetailsQuery } from '@/api/applications';
import useToast from '@/hooks/useToast';

import { useCancelEvalRunMutation, useEvalRunQuery, useStartEvalRunMutation } from '../../api';
import { EVAL_RUN_FALLBACK_POLL_MS, EVAL_RUN_TRIGGER } from '../constants';
import { isRunActive, isRunTerminal, parseEvalError } from '../helpers';
import { useEvalRunLiveProgress } from './useEvalRunLiveProgress.hooks';

export const useEvalRunActions = ({
  projectId,
  editingSuiteId,
  applicationId,
  attachedDatasetId,
  attachedDatasetDetails,
  attachedDimensionsCount,
}) => {
  const { toastError } = useToast();

  const [fetchApplicationDetails] = useLazyApplicationDetailsQuery();
  const [startEvalRun, { isLoading: isStartingRun }] = useStartEvalRunMutation();
  const [cancelEvalRun] = useCancelEvalRunMutation();

  const [activeRunId, setActiveRunId] = useState(null);
  const [cancelRequested, setCancelRequested] = useState(false);
  const terminalNotifiedRef = useRef(null);
  const [runPollingInterval, setRunPollingInterval] = useState(0);

  const shouldFetchRun = !!activeRunId && projectId != null;
  const { data: activeRun, isError: isRunError } = useEvalRunQuery(
    { projectId, runId: activeRunId },
    { skip: !shouldFetchRun, pollingInterval: runPollingInterval },
  );

  const runSettled = isRunTerminal(activeRun?.status) || isRunError;
  const runActive = isRunActive(activeRun?.status);

  const { isLive } = useEvalRunLiveProgress({
    projectId,
    runId: activeRunId,
    enabled: shouldFetchRun && !runSettled,
  });

  useEffect(() => {
    setRunPollingInterval(shouldFetchRun && !runSettled && !isLive ? EVAL_RUN_FALLBACK_POLL_MS : 0);
  }, [shouldFetchRun, runSettled, isLive]);

  useEffect(() => {
    if (isRunTerminal(activeRun?.status) && terminalNotifiedRef.current !== activeRunId) {
      terminalNotifiedRef.current = activeRunId;
    }
  }, [activeRun?.status, activeRunId]);

  useEffect(() => {
    setCancelRequested(false);
  }, [activeRunId]);

  const handleEvaluate = useCallback(async () => {
    if (!editingSuiteId) return;

    if (!attachedDatasetId) {
      toastError('Please attach a dataset before running the evaluation.');
      return;
    }
    const caseCount = attachedDatasetDetails?.case_count ?? attachedDatasetDetails?.cases?.length ?? 0;
    if (caseCount === 0) {
      toastError('The attached dataset has no cases. Please add at least one case.');
      return;
    }
    if (attachedDimensionsCount === 0) {
      toastError('Please add at least one dimension before running the evaluation.');
      return;
    }

    let applicationVersionId = null;
    if (projectId && applicationId) {
      try {
        const appDetails = await fetchApplicationDetails({ projectId, applicationId }).unwrap();
        applicationVersionId = appDetails?.version_details?.id ?? null;
      } catch {
        // If fetch fails, proceed with null and let backend handle it
      }
    }

    try {
      const started = await startEvalRun({
        projectId,
        body: {
          suite_id: editingSuiteId,
          trigger_type: EVAL_RUN_TRIGGER.offline_batch,
          dataset_id: attachedDatasetId,
          application_version_id: applicationVersionId,
        },
      }).unwrap();
      setActiveRunId(started?.id ?? null);
    } catch (error) {
      toastError(parseEvalError(error, 'Failed to start evaluation run.'));
    }
  }, [
    editingSuiteId,
    applicationId,
    attachedDatasetId,
    attachedDatasetDetails,
    attachedDimensionsCount,
    fetchApplicationDetails,
    startEvalRun,
    projectId,
    toastError,
  ]);

  const handleCancelRun = useCallback(async () => {
    if (!activeRunId) return;
    try {
      await cancelEvalRun({ projectId, runId: activeRunId }).unwrap();
      setCancelRequested(true);
    } catch {
      // 409 means the run reached a terminal state first; the poll shows the truth.
    }
  }, [cancelEvalRun, projectId, activeRunId]);

  const handleOpenHistory = useCallback(() => {
    // TODO: wire up results history
  }, []);

  return {
    activeRun,
    runActive,
    isEvaluating: isStartingRun || runActive,
    cancelRequested,
    handleEvaluate,
    handleCancelRun,
    handleOpenHistory,
  };
};
