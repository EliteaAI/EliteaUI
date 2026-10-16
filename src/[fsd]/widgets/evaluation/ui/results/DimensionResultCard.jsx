import { memo, useCallback, useMemo } from 'react';

import { Box, Tooltip, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import EditPenIcon from '@/components/Icons/EditPenIcon';

import { EVAL_ENGINE, EVAL_RESULT_STATUS } from '../../lib/constants';
import { formatHumanOutcome, formatScore, getBindingEngineLabel, resolveHumanScale } from '../../lib/helpers';

const NO_COMMENTS = 'No comments provided.';
const AWAITING_HUMAN = 'Awaiting human evaluation.';
const NOT_SCORED = 'Not scored for this case.';

// A latency check on a case that hit the suite's time limit (performance design §3.3): scored as
// the worst value without running the check.
const EXCEEDED_STATUS = 'exceeded';

const isErrored = cell =>
  cell.result?.status === EVAL_RESULT_STATUS.error || !!cell.verdict?.error || !!cell.evidence?.error;

const getMetLabel = met => {
  if (met == null) return null;
  return met ? 'Met' : 'Missed';
};

// A code check has no rationale; what it printed (e.g. "1.7 s of the 10 s limit") stands in.
const getRationale = cell =>
  cell.verdict?.rationale ?? cell.evidence?.rationale ?? cell.verdict?.note ?? cell.verdict?.stdout ?? null;

const getErrorMessage = cell =>
  cell.verdict?.stderr ||
  cell.verdict?.error ||
  cell.evidence?.stderr ||
  cell.evidence?.error ||
  cell.result?.error ||
  'Validation failed to run.';

const DimensionResultCard = memo(props => {
  const { cell, canEvaluate = false, onEvaluate } = props;

  const handleEvaluate = useCallback(() => {
    onEvaluate?.(cell);
  }, [onEvaluate, cell]);

  const { binding, nativeScore, met } = cell;
  const scale = useMemo(() => resolveHumanScale(binding), [binding]);

  const isHuman = binding.engine === EVAL_ENGINE.human;
  const isError = isErrored(cell);
  const isSkipped = !isError && (cell.skipped || cell.result?.status === EVAL_RESULT_STATUS.skipped);
  const isExceeded = !isError && cell.verdict?.status === EXCEEDED_STATUS;
  const isPending = !isError && !isSkipped && cell.pending;
  const canAct = canEvaluate && isHuman && !!onEvaluate;

  const engineLabel = getBindingEngineLabel(binding);
  const metLabel = getMetLabel(met);
  const rationale = getRationale(cell);

  const scoreText = isHuman ? formatHumanOutcome(nativeScore, scale) : formatScore(nativeScore);
  const scoreLabel = `${isExceeded ? 'Exceeded' : `Score: ${scoreText}`}${metLabel ? ` | ${metLabel}` : ''}`;

  const styles = dimensionResultCardStyles();

  return (
    <Box
      sx={[styles.root, isError && styles.rootError, isPending && isHuman && styles.rootPending]}
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
          <Box sx={styles.engineBadge}>
            <Typography
              variant="bodySmall"
              sx={styles.engineText}
            >
              {engineLabel}
            </Typography>
          </Box>
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

          {isSkipped && (
            <Typography
              variant="bodySmall"
              sx={styles.skippedLabel}
              data-testid="dimension-skipped-label"
            >
              Skipped
            </Typography>
          )}

          {!isError && isPending && canAct && (
            <Button.BaseBtn
              variant={BUTTON_VARIANTS.auxiliary}
              color={BUTTON_COLORS.primary}
              size="small"
              onClick={handleEvaluate}
              sx={styles.evaluateButton}
              data-testid="dimension-evaluate-action"
            >
              Evaluate
            </Button.BaseBtn>
          )}

          {!isError && isPending && !canAct && (
            <Typography
              variant="bodySmall"
              sx={styles.pendingLabel}
            >
              Pending
            </Typography>
          )}

          {!isError && !isSkipped && !isPending && (
            <>
              <Typography
                variant="bodySmall"
                sx={[styles.scoreInfo, isExceeded && styles.exceededLabel]}
                data-testid="dimension-score-label"
              >
                {scoreLabel}
              </Typography>
              {canAct && (
                <Tooltip
                  title="Edit evaluation"
                  placement="top"
                >
                  <Box component="span">
                    <Button.BaseBtn
                      variant={BUTTON_VARIANTS.tertiary}
                      aria-label="Edit evaluation"
                      onClick={handleEvaluate}
                      sx={styles.editButton}
                      startIcon={<EditPenIcon sx={styles.editIcon} />}
                      data-testid="dimension-edit-action"
                    />
                  </Box>
                </Tooltip>
              )}
            </>
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

      {isSkipped && (
        <Typography
          variant="bodySmall"
          sx={styles.mutedMessage}
        >
          {cell.verdict?.note || NOT_SCORED}
        </Typography>
      )}

      {!isError && isPending && !canAct && (
        <Typography
          variant="bodySmall"
          sx={styles.mutedMessage}
        >
          {AWAITING_HUMAN}
        </Typography>
      )}

      {!isError && !isSkipped && !isPending && isHuman && (
        <Typography
          variant="bodySmall"
          sx={[styles.rationale, !cell.humanNote && styles.mutedMessage]}
        >
          {cell.humanNote || NO_COMMENTS}
        </Typography>
      )}

      {!isError && !isSkipped && !isPending && !isHuman && rationale && (
        <Typography
          variant="bodySmall"
          sx={styles.rationale}
        >
          {rationale}
        </Typography>
      )}
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
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.surface.interactive.default,
    border: `0.0625rem solid transparent`,
  }),
  rootError: ({ palette }) => ({
    borderColor: palette.alert.error.border,
  }),
  rootPending: ({ palette }) => ({
    backgroundColor: palette.components.participant.background.active,
  }),
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '0.5rem',
    minHeight: '1.5rem',
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
    gap: '0.25rem',
    flexShrink: 0,
  },
  dimensionName: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  engineBadge: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    padding: '0.125rem 0.5rem',
    borderRadius: '1rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    backgroundColor: 'transparent',
  }),
  engineText: ({ palette }) => ({
    color: palette.text.primary,
    fontSize: '0.75rem',
    lineHeight: '1rem',
  }),
  scoreInfo: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  errorLabel: ({ palette }) => ({
    color: palette.alert.error.text,
    fontWeight: 500,
  }),
  skippedLabel: ({ palette }) => ({
    color: palette.text.primary,
    fontStyle: 'italic',
  }),
  exceededLabel: ({ palette }) => ({
    color: palette.alert.error.text,
    fontWeight: 500,
  }),
  pendingLabel: ({ palette }) => ({
    color: palette.alert.warning.text,
  }),
  evaluateButton: {
    padding: '0 0.25rem',
    minWidth: 'auto',
    fontWeight: 500,
  },
  editButton: ({ palette }) => ({
    minWidth: 'unset',
    padding: '0.25rem',
    '& .MuiButton-startIcon': {
      margin: 0,
    },
    '&:hover': {
      backgroundColor: palette.background.surface.interactive.selected,
    },
  }),
  editIcon: {
    fontSize: '1rem',
  },
  rationale: ({ palette }) => ({
    color: palette.text.primary,
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  }),
  mutedMessage: ({ palette }) => ({
    color: palette.text.primary,
    fontStyle: 'italic',
  }),
  errorMessage: ({ palette }) => ({
    color: palette.alert.error.text,
    fontFamily: 'monospace',
    fontSize: '0.75rem',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  }),
});

export default DimensionResultCard;
