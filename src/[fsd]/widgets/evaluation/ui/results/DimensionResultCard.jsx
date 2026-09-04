import { memo, useCallback } from 'react';

import { Box, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

import { EVAL_ENGINE, EVAL_RESULT_STATUS } from '../../lib/constants';
import { formatScore, getBindingEngineLabel } from '../../lib/helpers';

const TARGET_STATUS = {
  met: 'met',
  missed: 'missed',
  pending: 'pending',
  error: 'error',
  noTarget: 'noTarget',
};

const getTargetStatus = cell => {
  if (cell.result?.status === EVAL_RESULT_STATUS.error || cell.verdict?.error || cell.evidence?.error) {
    return TARGET_STATUS.error;
  }
  if (cell.pending) {
    return TARGET_STATUS.pending;
  }
  if (cell.met != null) {
    return cell.met ? TARGET_STATUS.met : TARGET_STATUS.missed;
  }
  return TARGET_STATUS.noTarget;
};

const getTargetLabel = (binding, met) => {
  if (binding.target == null || binding.target === '' || !binding.operator) return null;
  const op = binding.operator === '>=' ? '≥' : binding.operator;
  const targetValue = `Target: ${op}${binding.target}`;
  if (met != null) {
    return `${targetValue} | ${met ? 'Met' : 'Missed'}`;
  }
  return targetValue;
};

const getRationale = cell => {
  if (cell.verdict?.rationale) return cell.verdict.rationale;
  if (cell.evidence?.rationale) return cell.evidence.rationale;
  return null;
};

const getErrorMessage = cell => {
  const verdict = cell.verdict;
  const ev = cell.evidence;
  return (
    verdict?.stderr ||
    verdict?.error ||
    ev?.stderr ||
    ev?.error ||
    cell.result?.error ||
    'Validation failed to run.'
  );
};

const DimensionResultCard = memo(props => {
  const { cell, onEvaluate } = props;

  const handleEvaluate = useCallback(() => {
    onEvaluate?.(cell);
  }, [onEvaluate, cell]);

  const { binding, nativeScore, met } = cell;
  const engineLabel = getBindingEngineLabel(binding);
  const isHuman = binding.engine === EVAL_ENGINE.human;
  const targetStatus = getTargetStatus(cell);
  const targetLabel = getTargetLabel(binding, met);
  const rationale = getRationale(cell);
  const isError = targetStatus === TARGET_STATUS.error;
  const isPending = targetStatus === TARGET_STATUS.pending;

  const styles = dimensionResultCardStyles();

  return (
    <Box
      sx={[styles.root, isError && styles.rootError]}
      data-testid="dimension-result-card"
    >
      <Box sx={styles.header}>
        <Box sx={styles.headerLeft}>
          <Typography
            variant="labelMedium"
            sx={styles.dimensionName}
          >
            {binding.name}
          </Typography>
        </Box>
        <Box sx={styles.headerRight}>
          {isError && (
            <Typography
              variant="bodySmall"
              sx={styles.errorLabel}
            >
              Error
            </Typography>
          )}
          {!isError && isPending && isHuman && onEvaluate && (
            <Button.BaseBtn
              variant={BUTTON_VARIANTS.text}
              color={BUTTON_COLORS.primary}
              size="small"
              onClick={handleEvaluate}
              sx={styles.evaluateButton}
            >
              Evaluate
            </Button.BaseBtn>
          )}
          {!isError && isPending && !(isHuman && onEvaluate) && (
            <Typography
              variant="bodySmall"
              sx={styles.pendingLabel}
            >
              Pending
            </Typography>
          )}
          {!isError && !isPending && (
            <Typography
              variant="bodySmall"
              sx={styles.scoreInfo}
            >
              Score: {formatScore(nativeScore)}
              {targetLabel ? ` | ${targetLabel}` : ''}
            </Typography>
          )}
        </Box>
      </Box>

      {isError && (
        <Typography
          variant="bodySmall"
          sx={styles.errorMessage}
        >
          {getErrorMessage(cell)}
        </Typography>
      )}
      {!isError && rationale && (
        <Typography
          variant="bodySmall"
          sx={styles.rationale}
        >
          {rationale}
        </Typography>
      )}
      {!isError && !rationale && isPending && isHuman && (
        <Typography
          variant="bodySmall"
          sx={styles.pendingMessage}
        >
          Awaiting human evaluation
        </Typography>
      )}

      <Box sx={styles.footer}>
        <Box sx={styles.engineBadge}>
          <Typography
            variant="bodySmall"
            sx={styles.engineText}
          >
            {engineLabel}
          </Typography>
        </Box>
        {targetStatus !== TARGET_STATUS.noTarget && targetStatus !== TARGET_STATUS.error && (
          <Box sx={[styles.statusBadge, styles[`status_${targetStatus}`]]}>
            <Typography
              variant="bodySmall"
              sx={styles.statusText}
            >
              {targetStatus === TARGET_STATUS.met && 'Met'}
              {targetStatus === TARGET_STATUS.missed && 'Missed'}
              {targetStatus === TARGET_STATUS.pending && 'Pending'}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
});

DimensionResultCard.displayName = 'DimensionResultCard';

/** @type {MuiSx} */
const dimensionResultCardStyles = () => ({
  root: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '0.5rem 1rem 0.5rem 1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.userInputBackground,
    border: `0.0625rem solid transparent`,
  }),
  rootError: ({ palette }) => ({
    borderColor: palette.border.indexResult.error,
  }),
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '0.5rem',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    minWidth: 0,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  },
  dimensionName: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 500,
  }),
  scoreInfo: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  errorLabel: ({ palette }) => ({
    color: palette.text.indexResult.error,
    fontWeight: 500,
  }),
  pendingLabel: ({ palette }) => ({
    color: palette.text.indexResult.warning,
  }),
  evaluateButton: ({ palette }) => ({
    padding: '0.125rem 0.5rem',
    minWidth: 'auto',
    color: palette.primary.main,
    fontWeight: 500,
  }),
  rationale: ({ palette }) => ({
    color: palette.text.default,
    lineHeight: 1.5,
  }),
  errorMessage: ({ palette }) => ({
    color: palette.text.indexResult.error,
    fontFamily: 'monospace',
    fontSize: '0.75rem',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  }),
  pendingMessage: ({ palette }) => ({
    color: palette.text.default,
    fontStyle: 'italic',
  }),
  footer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginTop: '0.25rem',
  },
  engineBadge: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.125rem 0.5rem',
    borderRadius: '1rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    backgroundColor: 'transparent',
  }),
  engineText: ({ palette }) => ({
    color: palette.text.default,
    fontSize: '0.75rem',
    lineHeight: '1rem',
  }),
  statusBadge: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.125rem 0.5rem',
    borderRadius: '1rem',
    backgroundColor: palette.background.tabButton.default,
  }),
  status_met: ({ palette }) => ({
    backgroundColor: palette.background.indexResult.success,
    '& .MuiTypography-root': {
      color: palette.text.indexResult.success,
    },
  }),
  status_missed: ({ palette }) => ({
    backgroundColor: palette.background.indexResult.error,
    '& .MuiTypography-root': {
      color: palette.text.indexResult.error,
    },
  }),
  status_pending: ({ palette }) => ({
    backgroundColor: palette.background.indexResult.warning,
    '& .MuiTypography-root': {
      color: palette.text.indexResult.warning,
    },
  }),
  statusText: {
    fontSize: '0.75rem',
    lineHeight: '1rem',
    fontWeight: 500,
  },
});

export default DimensionResultCard;
