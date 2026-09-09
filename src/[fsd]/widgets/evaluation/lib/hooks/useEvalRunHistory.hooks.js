import { useCallback, useEffect, useMemo, useState } from 'react';

import { useSearchParams } from 'react-router-dom';

import { useTableSort } from '@/[fsd]/entities/grid-table/lib';
import { compareRunTimestamp } from '@/[fsd]/entities/run-history/lib/helpers';
import { useApplicationDetailsQuery } from '@/api/applications';
import useCheckPermission from '@/hooks/useCheckPermission';
import useToast from '@/hooks/useToast';

import { useDeleteEvalRunMutation, useEvalRunQuery, useEvalRunsQuery, useEvalSuitesQuery } from '../../api';
import { EVAL_PERMISSIONS } from '../constants';
import {
  buildRunHistory,
  compareRunScore,
  parseEvalError,
  resolveRunSuiteName,
  resolveRunVersionName,
  sinkUnscoredRuns,
} from '../helpers';
import { useEvaluationExport } from './useEvaluationExport.hooks';

// The run whose results are shown travels in the URL, so a copied link reopens the same run (§6).
export const RUN_SEARCH_PARAM = 'run';

const SORT_FIELD = {
  date: 'date',
  suite: 'suite',
  version: 'version',
  score: 'score',
};

/**
 * Backing state for the Results History screen (#6541): every run recorded for one agent, the run
 * currently being read, and the row actions. Selection is mirrored into the URL rather than kept
 * only in component state so Share can hand out a link that reopens the same run.
 */
export const useEvalRunHistory = ({ projectId, applicationId }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toastError, toastSuccess } = useToast();
  const { checkPermission } = useCheckPermission();

  const canDelete = checkPermission(EVAL_PERMISSIONS.runDelete);

  const skip = !projectId || !applicationId;

  const {
    data: runs = [],
    isLoading: isRunsLoading,
    isError: isRunsError,
  } = useEvalRunsQuery({ projectId, applicationId }, { skip });
  const { data: suites = [] } = useEvalSuitesQuery({ projectId, applicationId }, { skip });
  // The run records only `application_version_id`; the names live on the agent.
  const { data: applicationDetails } = useApplicationDetailsQuery({ projectId, applicationId }, { skip });

  const versions = useMemo(() => applicationDetails?.versions ?? [], [applicationDetails]);

  const [deleteEvalRun, { isLoading: isDeleting }] = useDeleteEvalRunMutation();
  const [runToDelete, setRunToDelete] = useState(null);

  const suiteNamesById = useMemo(() => Object.fromEntries(suites.map(s => [s.id, s.name])), [suites]);

  const urlRunId = useMemo(() => {
    const raw = searchParams.get(RUN_SEARCH_PARAM);
    if (!raw) return null;
    const parsed = parseInt(raw, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }, [searchParams]);

  const [selectedRunId, setSelectedRunId] = useState(urlRunId);

  // Deltas compare each run against the next *scored* run older than it, so they must be derived
  // from the API's newest-first order — not from whatever column the user is sorting by.
  const runsWithDelta = useMemo(() => buildRunHistory(runs), [runs]);

  const comparators = useMemo(
    () => ({
      [SORT_FIELD.date]: (_a, _b, rowA, rowB) =>
        compareRunTimestamp(rowA.started_at || rowA.created_at, rowB.started_at || rowB.created_at),
      [SORT_FIELD.suite]: (_a, _b, rowA, rowB) =>
        resolveRunSuiteName(rowA, suiteNamesById).localeCompare(resolveRunSuiteName(rowB, suiteNamesById)),
      // A run whose version was never recorded or has since been deleted compares as an empty name.
      [SORT_FIELD.version]: (_a, _b, rowA, rowB) =>
        (resolveRunVersionName(rowA, versions) ?? '').localeCompare(
          resolveRunVersionName(rowB, versions) ?? '',
        ),
      [SORT_FIELD.score]: (_a, _b, rowA, rowB) => compareRunScore(rowA, rowB),
    }),
    [suiteNamesById, versions],
  );

  const { sortConfig, handleSort, sortData } = useTableSort({
    defaultField: SORT_FIELD.date,
    defaultDirection: 'desc',
    comparators,
  });

  const sortedRuns = useMemo(() => {
    const sorted = sortData(runsWithDelta) ?? [];
    // `useTableSort` negates a comparator's result for descending, so `compareRunScore` cannot sink
    // unscored runs on its own without floating them to the top in the other direction. Partition
    // them out here instead, after the sort has ordered the scored ones.
    return sortConfig.field === SORT_FIELD.score ? sinkUnscoredRuns(sorted) : sorted;
  }, [sortData, runsWithDelta, sortConfig.field]);

  // Default to the most recent run, and recover when the id in the URL names a run that is gone.
  useEffect(() => {
    if (runs.length === 0) {
      if (selectedRunId !== null) setSelectedRunId(null);
      return;
    }
    const isSelectionValid = runs.some(run => run.id === selectedRunId);
    if (isSelectionValid) return;
    const fromUrl = runs.find(run => run.id === urlRunId);
    setSelectedRunId(fromUrl?.id ?? runs[0].id);
  }, [runs, selectedRunId, urlRunId]);

  useEffect(() => {
    if (selectedRunId == null || selectedRunId === urlRunId) return;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set(RUN_SEARCH_PARAM, String(selectedRunId));
    setSearchParams(nextParams, { replace: true });
  }, [selectedRunId, urlRunId, searchParams, setSearchParams]);

  // The list rows carry no snapshot, so the detail read is what supplies the frozen suite name and
  // the case set the results view renders.
  const { data: selectedRunData, isFetching: isSelectedRunFetching } = useEvalRunQuery(
    { projectId, runId: selectedRunId },
    { skip: !projectId || selectedRunId == null },
  );

  // RTK Query keeps the previous response while fetching the next one. When the user clicks a
  // different row the stale data would flash until the new response lands. Treat the cached value
  // as absent when it belongs to a different run so the loader shows instead.
  const selectedRun = selectedRunData?.id === selectedRunId ? selectedRunData : null;

  const handleSelectRun = useCallback(run => {
    if (run?.id == null) return;
    setSelectedRunId(run.id);
  }, []);

  const handleShareRun = useCallback(
    async run => {
      if (run?.id == null) return;
      const url = new URL(window.location.href);
      url.searchParams.set(RUN_SEARCH_PARAM, String(run.id));
      try {
        await navigator.clipboard.writeText(url.toString());
        toastSuccess('Link copied to clipboard.');
      } catch {
        toastError('Failed to copy the link to the clipboard.');
      }
    },
    [toastError, toastSuccess],
  );

  const { exportRun, exportingRunId } = useEvaluationExport({
    projectId,
    applicationId,
    suiteNamesById,
  });

  const handleRequestDelete = useCallback(run => {
    setRunToDelete(run);
  }, []);

  const handleCloseDelete = useCallback(() => {
    setRunToDelete(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!runToDelete) return;
    // Resolved before the list refetches: after the row is gone its neighbours are what the user
    // expects to land on — the next run down, or the previous one when it was the last row (§7).
    const removedIndex = sortedRuns.findIndex(run => run.id === runToDelete.id);
    const remaining = sortedRuns.filter(run => run.id !== runToDelete.id);
    const fallback = remaining[removedIndex] ?? remaining[removedIndex - 1] ?? null;

    try {
      await deleteEvalRun({ projectId, runId: runToDelete.id }).unwrap();
      if (selectedRunId === runToDelete.id) {
        setSelectedRunId(fallback?.id ?? null);
      }
      toastSuccess('Evaluation run has been removed.');
    } catch (error) {
      toastError(parseEvalError(error, 'Failed to remove the evaluation run.'));
    }
    setRunToDelete(null);
  }, [runToDelete, sortedRuns, deleteEvalRun, projectId, selectedRunId, toastSuccess, toastError]);

  return {
    runs: sortedRuns,
    suiteNamesById,
    versions,
    isRunsLoading,
    isRunsError,
    selectedRunId,
    selectedRun: selectedRunId == null ? null : selectedRun,
    isSelectedRunLoading: selectedRunId != null && isSelectedRunFetching && !selectedRun,
    canDelete,
    sortConfig,
    handleSort,
    handleSelectRun,
    handleShareRun,
    handleExportRun: exportRun,
    exportingRunId,
    runToDelete,
    isDeleting,
    handleRequestDelete,
    handleCloseDelete,
    handleConfirmDelete,
  };
};
