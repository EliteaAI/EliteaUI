import { memo } from 'react';

import { Box, Chip, Typography } from '@mui/material';

import BaseCheckbox from '@/[fsd]/shared/ui/checkbox/BaseCheckbox';
import ErrorIcon from '@/components/Icons/ErrorIcon';
import SuccessIcon from '@/components/Icons/SuccessIcon';

export const FIX_ROW_MODE = {
  checkbox: 'checkbox',
  status: 'status',
};

const DIMENSION_TIER_LABEL = {
  platform: 'Platform',
  project: 'Project',
  agent_adhoc: 'Agent',
};

const EnhanceFixRow = memo(props => {
  const {
    mode = FIX_ROW_MODE.checkbox,
    checked = false,
    onToggle,
    disabled = false,
    status,
    statusMessage,
    title,
    dimensionTier,
    before,
    after,
    rationale,
    testId,
  } = props;

  const styles = enhanceFixRowStyles(disabled);
  const tierLabel = dimensionTier ? DIMENSION_TIER_LABEL[dimensionTier] : null;

  const handleRowClick = () => {
    if (mode === FIX_ROW_MODE.checkbox && !disabled) {
      onToggle?.();
    }
  };

  return (
    <Box
      sx={styles.row}
      onClick={handleRowClick}
      data-testid={testId}
    >
      {/* The control sits in a box as tall as the title's line, so the two stay centred on each
          other whatever the row below them contains. */}
      <Box sx={styles.controlSlot}>
        {mode === FIX_ROW_MODE.checkbox ? (
          <BaseCheckbox
            size="small"
            checked={checked}
            disabled={disabled}
            onChange={() => onToggle?.()}
            onClick={e => e.stopPropagation()}
            sx={styles.checkbox}
          />
        ) : (
          <>{status === 'success' ? <SuccessIcon /> : <ErrorIcon />}</>
        )}
      </Box>
      <Box sx={styles.content}>
        {(title || tierLabel) && (
          <Box sx={styles.titleRow}>
            {title && (
              <Typography
                variant="bodyMedium"
                sx={styles.title}
              >
                {title}
              </Typography>
            )}
            {tierLabel && (
              <Chip
                label={tierLabel}
                size="small"
                variant="outlined"
                sx={styles.tierChip}
              />
            )}
          </Box>
        )}
        {(before != null || after != null) && (
          <Box sx={styles.diffBlock}>
            {before != null && (
              <Typography
                variant="bodySmall"
                sx={styles.before}
              >
                {before}
              </Typography>
            )}
            {after != null && (
              <Typography
                variant="bodySmall"
                sx={styles.after}
              >
                {after}
              </Typography>
            )}
          </Box>
        )}
        {rationale && (
          <Typography
            variant="bodySmall2"
            sx={styles.rationale}
          >
            {rationale}
          </Typography>
        )}
        {statusMessage && (
          <Typography
            variant="bodySmall2"
            sx={status === 'success' ? styles.statusMessageSuccess : styles.statusMessageError}
          >
            {statusMessage}
          </Typography>
        )}
      </Box>
    </Box>
  );
});

EnhanceFixRow.displayName = 'EnhanceFixRow';

/** @type {MuiSx} */
const enhanceFixRowStyles = disabled => ({
  row: ({ palette }) => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    padding: '0.75rem',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.cardsOutlines}`,
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.6 : 1,
  }),
  controlSlot: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    // The title line box (bodyMedium), so the control lands on the title's optical centre.
    minHeight: '1.5rem',
    flexShrink: 0,
  },
  checkbox: {
    padding: '0.25rem',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
    minWidth: 0,
    flex: 1,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  title: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 600,
  }),
  tierChip: ({ palette }) => ({
    color: palette.text.metrics,
    borderColor: palette.border.cardsOutlines,
    fontSize: '0.6875rem',
    height: '1.125rem',
    '& .MuiChip-label': {
      padding: '0 0.375rem',
    },
  }),
  diffBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  before: ({ palette }) => ({
    color: palette.text.primary,
    textDecoration: 'line-through',
    wordBreak: 'break-word',
  }),
  after: ({ palette }) => ({
    color: palette.text.secondary,
    wordBreak: 'break-word',
  }),
  rationale: ({ palette }) => ({
    color: palette.text.primary,
    fontStyle: 'italic',
  }),
  statusMessageSuccess: ({ palette }) => ({
    color: palette.status.published,
  }),
  statusMessageError: ({ palette }) => ({
    color: palette.text.error,
  }),
});

export default EnhanceFixRow;
