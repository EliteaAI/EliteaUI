import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useLazyApplicationDetailsQuery } from '@/api/applications';
import useToast from '@/hooks/useToast';

import {
  useCancelEvalRunMutation,
  useDeleteEvalRunMutation,
  useEvalRunQuery,
  useEvalRunsQuery,
  useStartEvalRunMutation,
} from '../../api';
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
  const { toastError, toastSuccess } = useToast();

  const [fetchApplicationDetails] = useLazyApplicationDetailsQuery();
  const [startEvalRun, { isLoading: isStartingRun }] = useStartEvalRunMutation();
  const [cancelEvalRun] = useCancelEvalRunMutation();
  const [deleteEvalRun] = useDeleteEvalRunMutation();

  const [activeRunId, setActiveRunId] = useState(null);
  const [cancelRequested, setCancelRequested] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const terminalNotifiedRef = useRef(null);
  const [runPollingInterval, setRunPollingInterval] = useState(0);

  // Fetch runs history from API (persists across page refresh)
  const skipRunsQuery = !projectId || !applicationId || editingSuiteId == null;
  const { data: runs = [], refetch: refetchRuns } = useEvalRunsQuery(
    { projectId, applicationId, suiteId: editingSuiteId },
    { skip: skipRunsQuery },
  );

  // Last run from API (most recent completed run)
  const lastRun = useMemo(() => (runs.length ? runs[0] : null), [runs]);

  // Fetch active run details (for in-progress runs)
  const shouldFetchActiveRun = !!activeRunId && projectId != null;
  const { data: activeRunData, isError: isRunError } = useEvalRunQuery(
    { projectId, runId: activeRunId },
    { skip: !shouldFetchActiveRun, pollingInterval: runPollingInterval },
  );

  const runSettled = isRunTerminal(activeRunData?.status) || isRunError;
  const runActive = isRunActive(activeRunData?.status);

  const { isLive } = useEvalRunLiveProgress({
    projectId,
    runId: activeRunId,
    enabled: shouldFetchActiveRun && !runSettled,
  });

  useEffect(() => {
    setRunPollingInterval(shouldFetchActiveRun && !runSettled && !isLive ? EVAL_RUN_FALLBACK_POLL_MS : 0);
  }, [shouldFetchActiveRun, runSettled, isLive]);

  // Refetch runs list when active run reaches terminal state
  useEffect(() => {
    if (isRunTerminal(activeRunData?.status) && terminalNotifiedRef.current !== activeRunId) {
      terminalNotifiedRef.current = activeRunId;
      refetchRuns();
    }
  }, [activeRunData?.status, activeRunId, refetchRuns]);

  useEffect(() => {
    setCancelRequested(false);
  }, [activeRunId]);

  // Reset active run when suite changes
  useEffect(() => {
    setActiveRunId(null);
    setCancelRequested(false);
    setShowClearConfirm(false);
  }, [editingSuiteId]);

  // A reload drops `activeRunId`, so re-adopt a run that is still in flight from the
  // history list — otherwise the panel falls back to the empty-results state while the
  // run keeps going on the backend.
  useEffect(() => {
    if (activeRunId != null) return;
    const inFlightRun = runs.find(run => isRunActive(run.status));
    if (inFlightRun?.id != null) {
      setActiveRunId(inFlightRun.id);
    }
  }, [runs, activeRunId]);

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

  // Determine which run to use for clear (active run or last run from history)
  const runToClear = activeRunId ? activeRunData : lastRun;

  const handleClearResults = useCallback(() => {
    if (!runToClear?.id) return;
    setShowClearConfirm(true);
  }, [runToClear?.id]);

  const handleCloseClearConfirm = useCallback(() => {
    setShowClearConfirm(false);
  }, []);

  const handleConfirmClearResults = useCallback(async () => {
    const runId = runToClear?.id;
    if (!runId) {
      setShowClearConfirm(false);
      return;
    }
    try {
      await deleteEvalRun({ projectId, runId }).unwrap();
      if (activeRunId === runId) {
        setActiveRunId(null);
      }
      toastSuccess('Results cleared successfully.');
      refetchRuns();
    } catch (error) {
      toastError(parseEvalError(error, 'Failed to clear results.'));
    }
    setShowClearConfirm(false);
  }, [deleteEvalRun, projectId, runToClear?.id, activeRunId, toastError, toastSuccess, refetchRuns]);

  const handleExportResults = useCallback(() => {
    // TODO: wire up export to Excel
  }, []);

  // Determine the "display run" — active run if in progress, otherwise last run from history
  const displayRun = runActive ? activeRunData : lastRun;

  return {
    activeRun: activeRunData,
    displayRun,
    lastRun,
    runs,
    runActive,
    isEvaluating: isStartingRun || runActive,
    cancelRequested,
    showClearConfirm,
    handleEvaluate,
    handleCancelRun,
    handleOpenHistory,
    handleClearResults,
    handleCloseClearConfirm,
    handleConfirmClearResults,
    handleExportResults,
  };
};
