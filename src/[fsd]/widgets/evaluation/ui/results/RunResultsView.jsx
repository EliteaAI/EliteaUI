import { memo, useCallback, useMemo, useState } from 'react';

import { Box, CircularProgress, SvgIcon, Typography } from '@mui/material';

import MonitoringIcon from '@/assets/monitoring.svg?react';
import useCheckPermission from '@/hooks/useCheckPermission';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import { useEvalDimensionsQuery, useEvalRunResultsQuery, usePlatformDimensionCatalogQuery } from '../../api';
import { EVAL_PERMISSIONS } from '../../lib/constants';
import { buildScorecard, formatRunStatus, isRunTerminal } from '../../lib/helpers';
import CaseDetailsModal from './CaseDetailsModal';
import CaseResultsList from './CaseResultsList';
import HumanEvaluationModal from './HumanEvaluationModal';
import ResultsDimensionTable from './ResultsDimensionTable';
import ResultsSummaryCards from './ResultsSummaryCards';

// A fresh `[]` default would be a new reference on every render while a query is skipped or
// errored, which would defeat the memo below and rebuild the whole scorecard each time.
const EMPTY_DIMENSIONS = [];

/**
 * Stored results of a single evaluation run — summary, per-dimension table and per-case
 * drill-down. The run is the only input, so the same view renders the suite's latest run on the
 * Evaluation page and any historical run picked on Results History (§8).
 */
const RunResultsView = memo(props => {
  const { run, applicationId, isLoading: isRunLoading = false, hasSuite = true, sx = {} } = props;

  const projectId = useSelectedProjectId();
  const { checkPermission } = useCheckPermission();
  const canEvaluate = checkPermission(EVAL_PERMISSIONS.humanScoreCreate);

  const hasResults = isRunTerminal(run?.status);
  const runId = hasResults ? (run?.id ?? null) : null;

  const {
    data: resultsDataRaw,
    isLoading: resultsLoading,
    isError: isResultsError,
  } = useEvalRunResultsQuery({ projectId, runId }, { skip: !projectId || !runId });

  // RTK Query keeps stale data while fetching new. Treat it as absent when the cached run ID
  // doesn't match so the loader stays visible instead of flashing the previous run's results.
  const resultsData = resultsDataRaw?.run?.id === runId ? resultsDataRaw : null;

  // The run snapshot is the point-in-time record, but it does not key every binding's dimension —
  // these fill the gaps so a rating or pass/fail scale still reaches the score control.
  const { data: agentProjectDimensions = EMPTY_DIMENSIONS, isLoading: agentDimensionsLoading } =
    useEvalDimensionsQuery(
      { projectId, agentId: applicationId, includePlatform: false },
      { skip: !projectId || !runId },
    );
  const { data: platformDimensions = EMPTY_DIMENSIONS, isLoading: platformDimensionsLoading } =
    usePlatformDimensionCatalogQuery({ projectId }, { skip: !projectId || !runId });
  const dimensions = useMemo(
    () => [...agentProjectDimensions, ...platformDimensions],
    [agentProjectDimensions, platformDimensions],
  );

  const scorecard = useMemo(
    () =>
      resultsData
        ? buildScorecard({
            run: resultsData.run,
            results: resultsData.results,
            humanScores: resultsData.human_scores,
            headlineScore: resultsData.headline_score,
            dimensions,
          })
        : null,
    [resultsData, dimensions],
  );

  // The server's `progress` only ever carries {done, total} — met/missed/errors/pending-human
  // counts are not aggregated server-side, so these read off the client-computed scorecard.
  const summaryData = useMemo(() => {
    if (!hasResults || !run) return null;
    const progress = run.progress ?? {};
    const counts = scorecard?.counts ?? {};

    return {
      totalScore: run.headline_score ?? null,
      cases: counts.total ?? progress.total ?? 0,
      metAllTargets: counts.metAll ?? 0,
      missed: counts.missedAny ?? 0,
      errors: counts.errors ?? 0,
      pendingHuman: scorecard?.pendingHuman ?? 0,
    };
  }, [hasResults, run, scorecard]);

  const [caseDetailsOpen, setCaseDetailsOpen] = useState(false);
  const [selectedCaseData, setSelectedCaseData] = useState(null);

  // The target outlives `open` so the dialog's content does not blank while it animates out.
  const [humanEvaluationOpen, setHumanEvaluationOpen] = useState(false);
  const [humanEvaluationTarget, setHumanEvaluationTarget] = useState(null);

  const handleViewCaseDetails = useCallback(card => {
    setSelectedCaseData(card);
    setCaseDetailsOpen(true);
  }, []);

  const handleCloseCaseDetails = useCallback(() => {
    setCaseDetailsOpen(false);
  }, []);

  const handleEvaluateDimension = useCallback((cell, card) => {
    setHumanEvaluationTarget({ cell, card });
    setHumanEvaluationOpen(true);
  }, []);

  const handleCloseHumanEvaluation = useCallback(() => {
    setHumanEvaluationOpen(false);
  }, []);

  const styles = runResultsViewStyles();

  // Show loader while any data is still in flight. The `!scorecard` fallback catches the window
  // where RTK Query returned cached (stale) data that we invalidated above — the query thinks it's
  // done, but we don't have usable data yet. A failed results read has to break out of that
  // fallback, otherwise the spinner never resolves.
  const isDataLoading =
    isRunLoading ||
    (hasResults &&
      !isResultsError &&
      (resultsLoading || agentDimensionsLoading || platformDimensionsLoading || !scorecard));

  if (isDataLoading) {
    return (
      <Box sx={[styles.centered, sx]}>
        <CircularProgress size={32} />
        <Typography
          variant="bodyMedium"
          sx={styles.description}
        >
          Loading results...
        </Typography>
      </Box>
    );
  }

  if (!hasSuite) {
    return (
      <Box sx={[styles.centered, sx]}>
        <SvgIcon
          component={MonitoringIcon}
          inheritViewBox
          sx={styles.icon}
        />
        <Typography
          variant="headingSmall"
          sx={styles.title}
        >
          No suite selected
        </Typography>
        <Typography
          variant="bodyMedium"
          sx={styles.description}
        >
          Select or create an evaluation suite to see results.
        </Typography>
      </Box>
    );
  }

  if (!run) {
    return (
      <Box sx={[styles.centered, sx]}>
        <SvgIcon
          component={MonitoringIcon}
          inheritViewBox
          sx={styles.icon}
        />
        <Typography
          variant="headingSmall"
          sx={styles.title}
        >
          No results yet.
        </Typography>
        <Typography
          variant="bodyMedium"
          sx={styles.description}
        >
          Results will be available after running an evaluation suite.
        </Typography>
      </Box>
    );
  }

  if (!hasResults) {
    return (
      <Box sx={[styles.centered, sx]}>
        <Typography
          variant="bodyMedium"
          sx={styles.description}
        >
          This run is {formatRunStatus(run.status).toLowerCase()}. Results will appear once it finishes.
        </Typography>
      </Box>
    );
  }

  if (isResultsError) {
    return (
      <Box sx={[styles.centered, sx]}>
        <Typography
          variant="bodyMedium"
          sx={styles.description}
        >
          Failed to load the results for this run. Please try refreshing the page.
        </Typography>
      </Box>
    );
  }

  if (!summaryData || !scorecard) {
    return (
      <Box sx={[styles.centered, sx]}>
        <Typography
          variant="bodyMedium"
          sx={styles.description}
        >
          This run has no stored results.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={[styles.root, sx]}
      data-testid="evaluation-run-results"
    >
      <Box sx={styles.summarySection}>
        <Typography
          variant="labelMedium"
          sx={styles.runLabel}
          data-testid="evaluation-run-label"
        >
          Run #{run.id}
        </Typography>
        <ResultsSummaryCards
          totalScore={summaryData.totalScore}
          cases={summaryData.cases}
          metAllTargets={summaryData.metAllTargets}
          missed={summaryData.missed}
          errors={summaryData.errors}
          pendingHuman={summaryData.pendingHuman}
        />
      </Box>
      <ResultsDimensionTable bindings={scorecard.bindings ?? []} />
      <CaseResultsList
        cases={scorecard.cases}
        canEvaluate={canEvaluate}
        onViewDetails={handleViewCaseDetails}
        onEvaluate={handleEvaluateDimension}
      />

      <CaseDetailsModal
        open={caseDetailsOpen}
        caseData={selectedCaseData}
        onClose={handleCloseCaseDetails}
      />

      <HumanEvaluationModal
        open={humanEvaluationOpen}
        projectId={projectId}
        runId={runId}
        cell={humanEvaluationTarget?.cell}
        caseData={humanEvaluationTarget?.card}
        onClose={handleCloseHumanEvaluation}
      />
    </Box>
  );
});

RunResultsView.displayName = 'RunResultsView';

/** @type {MuiSx} */
const runResultsViewStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  summarySection: {
    display: 'flex',
    flexDirection: 'column',
  },
  runLabel: ({ palette }) => ({
    padding: '0 1.5rem 0',
    color: palette.text.secondary,
    fontWeight: 600,
  }),
  centered: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '2rem',
  },
  icon: ({ palette }) => ({
    fontSize: '2rem',
    marginBottom: '0.5rem',
    '& path': {
      fill: palette.icon.fill.disabled,
    },
  }),
  title: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  description: ({ palette }) => ({
    color: palette.text.default,
    textAlign: 'center',
    maxWidth: '20.5rem',
  }),
});

export default RunResultsView;
