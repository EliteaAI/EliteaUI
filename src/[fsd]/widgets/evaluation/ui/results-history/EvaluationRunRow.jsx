import { memo, useCallback } from 'react';

import { Box, Tooltip, Typography } from '@mui/material';

import { formatRunTimestamp } from '@/[fsd]/entities/run-history/lib/helpers';

import { formatScoreDelta, getRunScoreLabel } from '../../lib/helpers';
import RunHistoryActionsMenu from './RunHistoryActionsMenu';

const EvaluationRunRow = memo(props => {
  const {
    run,
    suiteName,
    isSelected = false,
    canDelete = false,
    gridTemplateColumns,
    onSelect,
    onShare,
    onExport,
    onDelete,
  } = props;

  const handleClick = useCallback(() => {
    onSelect?.(run);
  }, [run, onSelect]);

  const deltaLabel = formatScoreDelta(run.delta);
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
        <Box
          className="run-row-actions"
          sx={styles.actions}
        >
          <RunHistoryActionsMenu
            run={run}
            canDelete={canDelete}
            onShare={onShare}
            onExport={onExport}
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
    borderBottom: `0.0625rem solid ${palette.border.table}`,
    backgroundColor: isSelected ? palette.background.dragging : 'transparent',
    borderRadius: isSelected ? '0.5rem' : 0,
    transition: 'background-color 0.2s ease',
    '& .run-row-actions': {
      opacity: isSelected ? 1 : 0,
    },
    '&:hover': {
      backgroundColor: palette.background.dragging,
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
        ? palette.background.indexResult[variant]
        : palette.background.tabButton.default,
    };
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    marginLeft: 'auto',
    transition: 'opacity 0.2s ease',
  },
});

export default EvaluationRunRow;
