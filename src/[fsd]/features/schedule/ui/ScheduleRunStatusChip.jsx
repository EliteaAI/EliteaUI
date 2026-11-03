import { memo } from 'react';

import { Box, Chip, CircularProgress } from '@mui/material';

import { toRunStatusMeta } from '../lib/helpers';

const ScheduleRunStatusChip = memo(props => {
  // variant: 'chip' (outlined, default), 'text' (icon and word in the status colour, no border) or 'icon' (icon only)
  const { status, variant = 'chip' } = props;

  const { Icon, color, label: statusLabel, isSpinner } = toRunStatusMeta(status);
  const styles = scheduleRunStatusChipStyles(color);
  const label = statusLabel || '-';

  const icon = isSpinner ? (
    <CircularProgress
      size="0.75rem"
      sx={styles.progress}
    />
  ) : (
    Icon && <Icon />
  );

  if (variant === 'icon') {
    return (
      <Box
        component="span"
        role="img"
        aria-label={label}
        data-testid="schedule-run-status"
        sx={styles.iconOnly}
      >
        {icon || label}
      </Box>
    );
  }

  return (
    <Chip
      data-testid="schedule-run-status"
      size="small"
      variant="outlined"
      icon={icon || undefined}
      label={label}
      sx={[styles.chip, variant === 'text' && styles.text]}
    />
  );
});

ScheduleRunStatusChip.displayName = 'ScheduleRunStatusChip';

// The colour is a palette path such as 'success.main'; sx resolves it for color, borderColor and fill
/** @type {MuiSx} */
const scheduleRunStatusChipStyles = statusColor => ({
  chip: ({ palette }) => ({
    height: '1.5rem',
    color: palette.text.secondary,
    borderColor: palette.border.lines,
    '& .MuiChip-icon': { fontSize: '0.875rem', color: statusColor },
  }),
  progress: { marginLeft: '0.375rem', color: statusColor },
  // The word takes the status colour, as in the schedule card
  text: { border: 'none', color: statusColor, '& .MuiChip-label': { paddingLeft: '0.25rem' } },
  // A 20 px hit area around the icon
  iconOnly: ({ palette }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '1.25rem',
    height: '1.25rem',
    color: palette.text.secondary,
    '& .MuiSvgIcon-root': { fontSize: '1rem', color: statusColor },
    '& .MuiCircularProgress-root': { marginLeft: 0, color: statusColor },
  }),
});

export default ScheduleRunStatusChip;
