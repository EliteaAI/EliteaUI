import { memo, useCallback } from 'react';

import { Box, Tooltip, Typography } from '@mui/material';

import { formatRunTimestamp } from '@/[fsd]/entities/run-history/lib/helpers';
import AttentionIcon from '@/components/Icons/AttentionIcon';

import {
  formatScoreDelta,
  getRunHistoryTrajectory,
  getRunHistoryUsage,
  getRunOverBudgetLabel,
  getRunScoreLabel,
  getRunStopLabel,
} from '../../lib/helpers';
import RunHistoryActionsMenu from './RunHistoryActionsMenu';

// A run that recorded no version (or whose version was deleted), usage or trajectory shows a dash.
const EMPTY_CELL_LABEL = '—';

const EvaluationRunRow = memo(props => {
  const {
    run,
    suiteName,
    versionName = null,
    isSelected = false,
    canDelete = false,
    exportingRunId = null,
    gridTemplateColumns,
    onSelect,
    onShare,
    onExport,
    onOpenAnalytics,
    onDelete,
  } = props;

  const handleClick = useCallback(() => {
    onSelect?.(run);
  }, [run, onSelect]);

  const deltaLabel = formatScoreDelta(run.delta);
  // A run stopped by a limit still shows the score of the cases it got through; the icon says so.
  const stopLabel = getRunStopLabel(run.meta);
  const overBudgetLabel = getRunOverBudgetLabel(run.meta);
  const usage = getRunHistoryUsage(run.meta);
  const trajectory = getRunHistoryTrajectory(run.meta);
  const styles = evaluationRunRowStyles(isSelected, gridTemplateColumns, run.delta);

  return (
    <Box
      sx={styles.row}
      onClick={handleClick}
      data-testid={`evaluation-run-row-${run.id}`}
    >
      <Box sx={styles.cell}>
        <Typography
          variant="bodySmall"
          sx={styles.text}
        >
          {formatRunTimestamp(run.started_at || run.created_at)}
        </Typography>
      </Box>

      <Box sx={styles.cell}>
        <Tooltip
          title={suiteName}
          placement="top"
        >
          <Typography
            variant="bodySmall"
            sx={styles.text}
          >
            {suiteName}
          </Typography>
        </Tooltip>
      </Box>

      <Box sx={styles.cell}>
        <Tooltip
          title={versionName ?? ''}
          placement="top"
        >
          <Typography
            variant="bodySmall"
            sx={styles.text}
            data-testid={`evaluation-run-version-${run.id}`}
          >
            {versionName ?? EMPTY_CELL_LABEL}
          </Typography>
        </Tooltip>
      </Box>

      <Box sx={styles.cell}>
        <Tooltip
          title={usage?.tooltip ?? 'No agent usage recorded'}
          placement="top"
        >
          <Typography
            variant="bodySmall"
            sx={styles.text}
            data-testid={`evaluation-run-tokens-${run.id}`}
          >
            {usage?.label ?? EMPTY_CELL_LABEL}
          </Typography>
        </Tooltip>
      </Box>

      <Box sx={styles.cell}>
        <Tooltip
          title={trajectory?.tooltip ?? 'No trajectory recorded'}
          placement="top"
        >
          <Typography
            variant="bodySmall"
            sx={[styles.text, trajectory?.hasErrors && styles.errorText]}
            data-testid={`evaluation-run-steps-${run.id}`}
          >
            {trajectory?.label ?? EMPTY_CELL_LABEL}
          </Typography>
        </Tooltip>
      </Box>

      <Box sx={styles.scoreCell}>
        {!!deltaLabel && (
          <Typography
            variant="bodySmall2"
            sx={styles.delta}
            data-testid={`evaluation-run-delta-${run.id}`}
          >
            {deltaLabel}
          </Typography>
        )}
        <Typography
          variant="bodySmall"
          sx={styles.score}
        >
          {getRunScoreLabel(run)}
        </Typography>
        {stopLabel && (
          <Tooltip
            title={stopLabel}
            placement="top"
          >
            <Box
              component="span"
              sx={styles.stopIcon}
              aria-label={stopLabel}
              data-testid={`evaluation-run-stop-${run.id}`}
            >
              <AttentionIcon />
            </Box>
          </Tooltip>
        )}
        {overBudgetLabel && (
          <Tooltip
            title={overBudgetLabel}
            placement="top"
          >
            <Box
              component="span"
              sx={styles.overBudget}
              data-testid={`evaluation-run-over-budget-${run.id}`}
            >
              Over budget
            </Box>
          </Tooltip>
        )}
        <Box
          className="run-row-actions"
          sx={styles.actions}
        >
          <RunHistoryActionsMenu
            run={run}
            canDelete={canDelete}
            exportingRunId={exportingRunId}
            onShare={onShare}
            onExport={onExport}
            onOpenAnalytics={onOpenAnalytics}
            onDelete={onDelete}
          />
        </Box>
      </Box>
    </Box>
  );
});

EvaluationRunRow.displayName = 'EvaluationRunRow';

/** @type {MuiSx} */
const evaluationRunRowStyles = (isSelected, gridTemplateColumns, delta) => ({
  row: ({ palette }) => ({
    display: 'grid',
    gridTemplateColumns,
    alignItems: 'center',
    width: '100%',
    minHeight: '2.5rem',
    flexShrink: 0,
    cursor: 'pointer',
    borderBottom: `0.0625rem solid ${palette.border.default}`,
    backgroundColor: isSelected ? palette.background.surface.interactive.dragging : 'transparent',
    borderRadius: isSelected ? '0.5rem' : 0,
    transition: 'background-color 0.2s ease',
    '& .run-row-actions': {
      opacity: isSelected ? 1 : 0,
    },
    '&:hover': {
      backgroundColor: palette.background.surface.interactive.dragging,
    },
    '&:hover .run-row-actions': {
      opacity: 1,
    },
    '&:focus-within .run-row-actions': {
      opacity: 1,
    },
  }),
  cell: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.5rem 1rem',
    minWidth: 0,
    overflow: 'hidden',
  },
  scoreCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.5rem 0.5rem 1rem',
    minWidth: 0,
  },
  text: ({ palette }) => ({
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: '1.5rem',
    color: palette.text.secondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  errorText: ({ palette }) => ({
    color: palette.error.main,
  }),
  score: ({ palette }) => ({
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: '1.5rem',
    color: palette.text.secondary,
    whiteSpace: 'nowrap',
  }),
  delta: ({ palette }) => {
    const variant = delta > 0 ? 'success' : delta < 0 ? 'error' : null;

    return {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.125rem 0.5rem',
      borderRadius: '0.625rem',
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: '1rem',
      whiteSpace: 'nowrap',
      color: variant ? palette.icon.indexResult[variant] : palette.text.secondary,
      backgroundColor: variant
        ? palette.alert[variant]?.background
        : palette.background.surface.interactive.default,
    };
  },
  stopIcon: ({ palette }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    '& svg': {
      width: '1rem',
      height: '1rem',
      fill: palette.icon.attention,
    },
  }),
  overBudget: ({ palette }) => ({
    padding: '0.125rem 0.5rem',
    borderRadius: '0.625rem',
    fontSize: '0.75rem',
    lineHeight: '1rem',
    whiteSpace: 'nowrap',
    color: palette.icon.indexResult.error,
    backgroundColor: palette.alert.error?.background,
    cursor: 'default',
  }),
  actions: {
    display: 'flex',
    alignItems: 'center',
    marginLeft: 'auto',
    transition: 'opacity 0.2s ease',
  },
});

export default EvaluationRunRow;
