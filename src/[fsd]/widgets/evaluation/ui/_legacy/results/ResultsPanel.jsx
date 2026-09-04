import { memo, useCallback, useMemo, useState } from 'react';

import { Box, CircularProgress, SvgIcon, Tooltip, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import ClockIcon from '@/assets/clock_icon.svg?react';
import DownloadIcon from '@/assets/download.svg?react';
import MonitoringIcon from '@/assets/monitoring.svg?react';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import { useEvalRunResultsQuery } from '../../../api';
import { buildScorecard, isRunTerminal } from '../../../lib/helpers';
import CaseDetailsModal from '../../results/CaseDetailsModal';
import CaseResultsList from '../../results/CaseResultsList';
import ResultsDimensionTable from '../../results/ResultsDimensionTable';
import ResultsSummaryCards from '../../results/ResultsSummaryCards';
import EvaluationProgress from '../../suite/EvaluationProgress';

const ResultsPanel = memo(props => {
  const { runActions = {} } = props;
  const projectId = useSelectedProjectId();

  const {
    activeRun,
    displayRun,
    runActive,
    cancelRequested,
    handleCancelRun: onCancelRun,
    handleOpenHistory: onOpenHistory,
    handleClearResults: onClearResults,
    handleExportResults: onExportResults,
  } = runActions;

  // Progress from active run (for in-progress state)
  const done = activeRun?.progress?.done ?? 0;
  const total = activeRun?.progress?.total ?? 0;
  const percent = total ? Math.min(100, Math.round((done / total) * 100)) : 0;

  // Results from displayRun (active run if in progress, otherwise last run from history)
  const hasResults = isRunTerminal(displayRun?.status);

  // Fetch detailed results for dimension table
  const runId = hasResults ? displayRun?.id : null;
  const { data: resultsData, isLoading: resultsLoading } = useEvalRunResultsQuery(
    { projectId, runId },
    { skip: !projectId || !runId },
  );

  const scorecard = useMemo(
    () =>
      resultsData
        ? buildScorecard({
            run: resultsData.run,
            results: resultsData.results,
            humanScores: resultsData.human_scores,
            headlineScore: resultsData.headline_score,
          })
        : null,
    [resultsData],
  );

  const summaryData = useMemo(() => {
    if (!hasResults || !displayRun) return null;
    const progress = displayRun.progress ?? {};
    return {
      totalScore: displayRun.headline_score ?? null,
      cases: progress.total ?? 0,
      metAllTargets: progress.met_all ?? 0,
      missed: progress.missed ?? 0,
      errors: progress.errors ?? 0,
      hasPendingHuman: (progress.pending_human ?? 0) > 0,
    };
  }, [hasResults, displayRun]);

  // Case details modal state
  const [caseDetailsOpen, setCaseDetailsOpen] = useState(false);
  const [selectedCaseData, setSelectedCaseData] = useState(null);

  const handleViewCaseDetails = useCallback(card => {
    setSelectedCaseData(card);
    setCaseDetailsOpen(true);
  }, []);

  const handleCloseCaseDetails = useCallback(() => {
    setCaseDetailsOpen(false);
  }, []);

  const handleEvaluateDimension = useCallback(() => {
    // TODO: wire up human evaluation workflow
  }, []);

  const styles = resultsPanelStyles();

  return (
    <Box sx={styles.root}>
      <Box sx={styles.header}>
        <Typography
          variant="bodyMedium"
          sx={styles.headerLabel}
        >
          Results
        </Typography>
        <Box sx={styles.headerActions}>
          {hasResults && (
            <>
              <Tooltip
                title="Export to Excel"
                placement="top"
              >
                <Box component="span">
                  <Button.BaseBtn
                    variant={BUTTON_VARIANTS.tertiary}
                    size="small"
                    onClick={onExportResults}
                    sx={styles.actionButton}
                    startIcon={
                      <SvgIcon
                        component={DownloadIcon}
                        inheritViewBox
                        sx={styles.actionIcon}
                      />
                    }
                  />
                </Box>
              </Tooltip>
              <Tooltip
                title="Clear the results"
                placement="top"
              >
                <Box component="span">
                  <Button.BaseBtn
                    variant={BUTTON_VARIANTS.tertiary}
                    size="small"
                    onClick={onClearResults}
                    sx={styles.actionButton}
                    startIcon={<DeleteIcon sx={styles.actionIcon} />}
                  />
                </Box>
              </Tooltip>
            </>
          )}
          <Box sx={styles.historyButtonWrapper}>
            <Tooltip
              title="View run history"
              placement="top"
            >
              <Box component="span">
                <Button.BaseBtn
                  variant={BUTTON_VARIANTS.tertiary}
                  size="small"
                  onClick={onOpenHistory}
                  sx={styles.historyButton}
                  startIcon={<ClockIcon style={{ fontSize: '1rem' }} />}
                />
              </Box>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      <Box sx={styles.content}>
        {runActive ? (
          <EvaluationProgress
            done={done}
            total={total}
            percent={percent}
            cancelRequested={cancelRequested}
            onCancel={onCancelRun}
          />
        ) : hasResults && resultsLoading ? (
          <Box sx={styles.centered}>
            <CircularProgress size={32} />
            <Typography
              variant="bodyMedium"
              sx={styles.emptyDescription}
            >
              Loading results...
            </Typography>
          </Box>
        ) : hasResults && summaryData && scorecard ? (
          <>
            <ResultsSummaryCards
              totalScore={summaryData.totalScore}
              cases={summaryData.cases}
              metAllTargets={summaryData.metAllTargets}
              missed={summaryData.missed}
              errors={summaryData.errors}
              hasPendingHuman={summaryData.hasPendingHuman}
            />
            <ResultsDimensionTable bindings={scorecard.bindings ?? []} />
            <CaseResultsList
              cases={scorecard.cases}
              onViewDetails={handleViewCaseDetails}
              onEvaluate={handleEvaluateDimension}
            />
          </>
        ) : (
          <Box sx={styles.centered}>
            <SvgIcon
              component={MonitoringIcon}
              inheritViewBox
              sx={styles.emptyIcon}
            />
            <Typography
              variant="headingSmall"
              sx={styles.emptyTitle}
            >
              No results yet.
            </Typography>
            <Typography
              variant="bodyMedium"
              sx={styles.emptyDescription}
            >
              Results will be available after running an evaluation suite.
            </Typography>
          </Box>
        )}
      </Box>

      <CaseDetailsModal
        open={caseDetailsOpen}
        caseData={selectedCaseData}
        onClose={handleCloseCaseDetails}
      />
    </Box>
  );
});

ResultsPanel.displayName = 'ResultsPanel';

export default ResultsPanel;

/** @type {MuiSx} */
const resultsPanelStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
  header: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 1.5rem',
    height: '3.3125rem',
    minHeight: '3.3125rem',
    boxSizing: 'border-box',
    backgroundColor: palette.background.folder.default,
    borderBottom: `0.0625rem solid ${palette.border.table}`,
  }),
  headerLabel: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 600,
  }),
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  actionButton: ({ palette }) => ({
    padding: '0.25rem',
    '&:hover svg path': {
      fill: palette.icon.fill.secondary,
    },
  }),
  actionIcon: {
    fontSize: '1rem',
  },
  historyButtonWrapper: ({ palette }) => ({
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    marginTop: '-0.75rem',
    marginBottom: '-0.75rem',
    paddingLeft: '1rem',
    marginLeft: '0.5rem',

    ':after': {
      content: "''",
      position: 'absolute',
      left: 0,
      top: '-0.75rem',
      height: 'calc(100% + 1.5rem)',
      width: '0.0625rem',
      background: palette.border.table,
    },
  }),
  historyButton: {
    padding: '0.25rem',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
    gap: '1rem',
  },
  centered: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '2rem',
  },
  emptyIcon: ({ palette }) => ({
    fontSize: '2rem',
    marginBottom: '0.5rem',
    '& path': {
      fill: palette.icon.fill.disabled,
    },
  }),
  emptyTitle: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  emptyDescription: ({ palette }) => ({
    color: palette.text.default,
    textAlign: 'center',
    maxWidth: '20.5rem',
  }),
});
