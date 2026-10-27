import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

import { NavigationHelpers } from '@/[fsd]/shared/lib/helpers';
import { useToast } from '@/[fsd]/shared/lib/hooks';
import { useApplicationDetailsQuery } from '@/api/applications';

import {
  useCancelEvalRunMutation,
  useDeleteEvalRunMutation,
  useEvalRunQuery,
  useEvalRunsQuery,
  useStartEvalRunMutation,
} from '../../api';
import { EVAL_RUN_FALLBACK_POLL_MS, EVAL_RUN_TRIGGER } from '../constants';
import { isRunActive, isRunTerminal, parseEvalError, withSuiteSearchParam } from '../helpers';
import { useEvalRoutes } from './useEvalRoutes.hooks';
import { useEvalRunLiveProgress } from './useEvalRunLiveProgress.hooks';
import { useEvaluationExport } from './useEvaluationExport.hooks';

const versionStorageKey = (projectId, applicationId, suiteId) =>
  `evaluation:version:${projectId}:${applicationId}:${suiteId}`;

const readStoredVersionId = key => {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw == null ? NaN : parseInt(raw, 10);
    return Number.isNaN(parsed) ? null : parsed;
  } catch {
    return null;
  }
};

const writeStoredVersionId = (key, versionId) => {
  try {
    if (versionId == null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, String(versionId));
  } catch {
    // Storage can be blocked or full; the selection then only lasts until a reload.
  }
};

export const useEvalRunActions = ({
  projectId,
  editingSuiteId,
  applicationId,
  agentId,
  tab,
  attachedDatasetId,
  attachedDatasetDetails,
  attachedDimensionsCount,
}) => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const evalRoutes = useEvalRoutes();
  const persistentSearch = NavigationHelpers.pickPersistentSearch(search);
  const { toastError, toastSuccess } = useToast();

  const { data: applicationDetails, isLoading: isLoadingVersions } = useApplicationDetailsQuery(
    { projectId, applicationId },
    { skip: !projectId || !applicationId },
  );
  const [startEvalRun, { isLoading: isStartingRun }] = useStartEvalRunMutation();
  const [cancelEvalRun] = useCancelEvalRunMutation();
  const [deleteEvalRun] = useDeleteEvalRunMutation();

  // The agent's resolved default version (`meta.default_version_id` or the `base` version) —
  // used to preselect the version dropdown and as the run's version unless the user picks another.
  const versions = useMemo(() => applicationDetails?.versions ?? [], [applicationDetails]);
  const defaultVersionId = applicationDetails?.version_details?.id ?? null;

  const [activeRunId, setActiveRunId] = useState(null);
  const [cancelRequested, setCancelRequested] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const storageKey =
    editingSuiteId == null ? null : versionStorageKey(projectId, applicationId, editingSuiteId);
  // Tagged with its suite key so a pick never carries over to another agent or suite.
  const [versionOverride, setVersionOverride] = useState(null);
  const storedVersionId = useMemo(() => (storageKey ? readStoredVersionId(storageKey) : null), [storageKey]);
  const terminalNotifiedRef = useRef(null);
  const [runPollingInterval, setRunPollingInterval] = useState(0);

  const currentOverride = versionOverride?.key === storageKey ? versionOverride.id : null;
  // Restored pick, validated against current versions.
  const restoredVersionId = versions.some(version => version.id === storedVersionId) ? storedVersionId : null;
  const selectedVersionId = currentOverride ?? restoredVersionId ?? defaultVersionId;

  const handleVersionChange = useCallback(
    versionId => {
      setVersionOverride({ key: storageKey, id: versionId });
      if (storageKey) writeStoredVersionId(storageKey, versionId);
    },
    [storageKey],
  );

  // Fetch runs history from API (persists across page refresh)
  const skipRunsQuery = !projectId || !applicationId || editingSuiteId == null;
  const { data: runs = [], refetch: refetchRuns } = useEvalRunsQuery(
    { projectId, applicationId, suiteId: editingSuiteId },
    { skip: skipRunsQuery },
  );

  // Last run from API (most recent completed run) — scoped to whichever version is
  // currently selected, so switching versions shows that version's own run history.
  const lastRun = useMemo(() => {
    const matching =
      selectedVersionId == null ? runs : runs.filter(run => run.application_version_id === selectedVersionId);
    return matching.length ? matching[0] : null;
  }, [runs, selectedVersionId]);

  // Fetch active run details (for in-progress runs)
  const shouldFetchActiveRun = !!activeRunId && projectId != null;
  const { data: fetchedActiveRun, isError: isRunError } = useEvalRunQuery(
    { projectId, runId: activeRunId },
    { skip: !shouldFetchActiveRun, pollingInterval: runPollingInterval },
  );
  // A skipped query keeps returning its last data, so drop it once there is no active run.
  const activeRunData = shouldFetchActiveRun ? fetchedActiveRun : undefined;

  const runSettled = isRunTerminal(activeRunData?.status) || isRunError;
  // Only one run can be in flight per suite, and the version selector is disabled for as long as
  // it is, so the run on screen is always the selected version's — no version scoping needed here.
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
    if (skipRunsQuery) return;
    if (isRunTerminal(activeRunData?.status) && terminalNotifiedRef.current !== activeRunId) {
      terminalNotifiedRef.current = activeRunId;
      refetchRuns();
    }
  }, [activeRunData?.status, activeRunId, refetchRuns, skipRunsQuery]);

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
      // Point the selector at the version being evaluated, otherwise a reload would show the
      // agent's default version next to another version's progress.
      if (inFlightRun.application_version_id != null) {
        setVersionOverride({ key: storageKey, id: inFlightRun.application_version_id });
      }
    }
  }, [runs, activeRunId, storageKey]);

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
    if (!selectedVersionId) {
      toastError('Please select an agent version to evaluate.');
      return;
    }

    try {
      const started = await startEvalRun({
        projectId,
        body: {
          suite_id: editingSuiteId,
          trigger_type: EVAL_RUN_TRIGGER.offline_batch,
          dataset_id: attachedDatasetId,
          application_version_id: selectedVersionId,
        },
      }).unwrap();
      setActiveRunId(started?.id ?? null);
    } catch (error) {
      toastError(parseEvalError(error, 'Failed to start evaluation run.'));
    }
  }, [
    editingSuiteId,
    attachedDatasetId,
    attachedDatasetDetails,
    attachedDimensionsCount,
    selectedVersionId,
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

  // Results History is its own screen (#6541), not a dialog — it needs a breadcrumb of its own and
  // a URL that can be shared down to the individual run.
  const handleOpenHistory = useCallback(() => {
    const historyPath = evalRoutes.history.replace(':tab', tab).replace(':agentId', agentId);
    navigate({
      pathname: historyPath,
      search: withSuiteSearchParam(persistentSearch, editingSuiteId),
    });
  }, [navigate, evalRoutes, tab, agentId, persistentSearch, editingSuiteId]);

  // Determine the "display run" — active run if in progress, otherwise last run from history
  const displayRun = runActive ? activeRunData : lastRun;
  const runToClear = displayRun;

  const { exportRun, isExporting } = useEvaluationExport({ projectId, applicationId });

  const handleExportResults = useCallback(() => exportRun(displayRun), [exportRun, displayRun]);

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

  return {
    applicationId,
    activeRun: activeRunData,
    displayRun,
    lastRun,
    runs,
    runActive,
    isEvaluating: isStartingRun || runActive,
    cancelRequested,
    showClearConfirm,
    versions,
    isLoadingVersions,
    selectedVersionId,
    handleVersionChange,
    handleEvaluate,
    handleCancelRun,
    handleOpenHistory,
    handleClearResults,
    handleCloseClearConfirm,
    handleConfirmClearResults,
    handleExportResults,
    isExporting,
  };
};
