import { memo } from 'react';

import { Box, Chip, Typography } from '@mui/material';

import BaseCheckbox from '@/[fsd]/shared/ui/checkbox/BaseCheckbox';

import { EVAL_FIX_KIND } from '../../lib/constants';
import { isAutoApplicableEvalFix } from '../../lib/helpers';

const DIMENSION_TIER_LABEL = {
  platform: 'Platform',
  project: 'Project',
  agent_adhoc: 'Agent',
};

const FIX_KIND_LABEL = {
  [EVAL_FIX_KIND.dimensionRubric]: 'Rubric',
  [EVAL_FIX_KIND.dimensionTarget]: 'Target',
  [EVAL_FIX_KIND.datasetCaseExpected]: 'Expected output',
  [EVAL_FIX_KIND.datasetCoverageGap]: 'Missing case',
};

const MANUAL_ONLY_MESSAGE = 'Not applied automatically — add this case in the dataset editor.';

const EnhanceEvalFixCard = memo(props => {
  const { fix, checked = false, onToggle, testId } = props;

  const canApply = isAutoApplicableEvalFix(fix);
  const tierLabel = fix.dimension_tier ? DIMENSION_TIER_LABEL[fix.dimension_tier] : null;

  const styles = enhanceEvalFixCardStyles(canApply);

  return (
    <Box
      sx={styles.card}
      data-testid={testId}
    >
      <Box sx={styles.header}>
        <Box sx={styles.titleGroup}>
          <Typography
            variant="bodyMedium"
            sx={styles.title}
          >
            {fix.target_name || FIX_KIND_LABEL[fix.kind] || 'Suggested change'}
          </Typography>
          {tierLabel && (
            <Chip
              label={tierLabel}
              size="small"
              variant="outlined"
              sx={styles.chip}
            />
          )}
          <Chip
            label={FIX_KIND_LABEL[fix.kind] || fix.kind}
            size="small"
            variant="outlined"
            sx={styles.chip}
          />
        </Box>
        {canApply && (
          <Box sx={styles.applyToggle}>
            <Typography sx={styles.applyLabel}>Apply changes</Typography>
            <BaseCheckbox
              size="small"
              checked={checked}
              onChange={() => onToggle?.()}
              sx={styles.checkbox}
            />
          </Box>
        )}
      </Box>

      <Box sx={styles.columns}>
        <Box sx={styles.column}>
          <Typography sx={styles.columnLabel}>Current</Typography>
          <Box sx={styles.valueCard}>
            <Typography
              variant="bodySmall"
              sx={fix.current_value ? styles.value : styles.emptyValue}
            >
              {fix.current_value || 'Nothing recorded'}
            </Typography>
          </Box>
        </Box>
        <Box sx={styles.column}>
          <Typography sx={styles.columnLabel}>Suggested</Typography>
          <Box sx={[styles.valueCard, styles.suggestedCard]}>
            <Typography
              variant="bodySmall"
              sx={styles.value}
            >
              {fix.proposed_value}
            </Typography>
          </Box>
        </Box>
      </Box>

      {fix.rationale && (
        <Typography
          variant="bodySmall2"
          sx={styles.rationale}
        >
          {fix.rationale}
        </Typography>
      )}

      {!canApply && (
        <Typography
          variant="bodySmall2"
          sx={styles.manualOnly}
        >
          {MANUAL_ONLY_MESSAGE}
        </Typography>
      )}
    </Box>
  );
});

EnhanceEvalFixCard.displayName = 'EnhanceEvalFixCard';

/** @type {MuiSx} */
const enhanceEvalFixCardStyles = canApply => ({
  card: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '1rem',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.cardsOutlines}`,
    opacity: canApply ? 1 : 0.75,
  }),
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  titleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexWrap: 'wrap',
    minWidth: 0,
  },
  title: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 600,
  }),
  chip: ({ palette }) => ({
    padding: '0.25rem 0.5rem',
    borderRadius: '1.0625rem',
    color: palette.text.primary,
    backgroundColor: 'transparent',
    border: `0.0625rem solid ${palette.background.surface.interactive.default}`,
    fontSize: '0.75rem',
    lineHeight: '1rem',
    whiteSpace: 'nowrap',

    '& .MuiChip-label': {
      padding: '0 0.375rem',
    },
  }),
  applyToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexShrink: 0,
  },
  applyLabel: {
    fontSize: '0.75rem',
    fontWeight: 500,
    color: 'text.secondary',
  },
  checkbox: {
    padding: '0.25rem',
  },
  columns: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'stretch',
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
    flex: 1,
    minWidth: 0,
  },
  columnLabel: {
    fontSize: '0.75rem',
    fontWeight: 500,
    lineHeight: '1rem',
    letterSpacing: '0.045rem',
    textTransform: 'uppercase',
    color: 'text.primary',
  },
  valueCard: ({ palette }) => ({
    flex: 1,
    padding: '0.5rem 0.75rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.surface.interactive.default,
    border: `0.0625rem solid ${palette.border.lines}`,
  }),
  suggestedCard: ({ palette }) => ({
    borderColor: palette.border.hover,
  }),
  value: ({ palette }) => ({
    color: palette.text.secondary,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  }),
  emptyValue: ({ palette }) => ({
    color: palette.text.primary,
    fontStyle: 'italic',
  }),
  rationale: ({ palette }) => ({
    color: palette.text.primary,
    fontStyle: 'italic',
  }),
  manualOnly: ({ palette }) => ({
    color: palette.text.attention,
  }),
});

export default EnhanceEvalFixCard;
