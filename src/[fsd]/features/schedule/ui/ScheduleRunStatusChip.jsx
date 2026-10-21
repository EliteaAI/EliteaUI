import { memo } from 'react';

import BlockIcon from '@mui/icons-material/Block';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import TimerOffOutlinedIcon from '@mui/icons-material/TimerOffOutlined';
import { Box, Chip, CircularProgress } from '@mui/material';

import { toRunStatusLabel } from '../lib/helpers';

const STATUS_ICONS = {
  success: { Icon: CheckCircleOutlineIcon, color: 'success.main' },
  waiting_for_approval: { Icon: HourglassEmptyIcon, color: 'warning.main' },
  waiting_for_input: { Icon: HourglassEmptyIcon, color: 'warning.main' },
  expired: { Icon: TimerOffOutlinedIcon, color: 'warning.main' },
  failed: { Icon: ErrorOutlineIcon, color: 'error.main' },
  blocked: { Icon: BlockIcon, color: 'error.main' },
  cancelled: { Icon: CancelOutlinedIcon, color: 'icon.default' },
  skipped: { Icon: SkipNextIcon, color: 'icon.default' },
};

const ScheduleRunStatusChip = memo(props => {
  // variant: 'chip' (outlined, default), 'text' (icon and word, no border) or 'icon' (icon only)
  const { status, variant = 'chip' } = props;

  const { Icon, color } = STATUS_ICONS[status] ?? {};
  const styles = scheduleRunStatusChipStyles(color);
  const label = toRunStatusLabel(status) || '-';

  const icon =
    status === 'running' ? (
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
      sx={[styles.chip, variant === 'text' && styles.noBorder]}
    />
  );
});

ScheduleRunStatusChip.displayName = 'ScheduleRunStatusChip';

/** @type {MuiSx} */
const scheduleRunStatusChipStyles = iconColor => ({
  chip: ({ palette }) => ({
    height: '1.5rem',
    color: palette.text.secondary,
    borderColor: palette.border.lines,
    '& .MuiChip-icon': { fontSize: '0.875rem', color: iconColor },
  }),
  progress: { marginLeft: '0.375rem' },
  noBorder: { border: 'none' },
  // A 20 px hit area around the icon
  iconOnly: ({ palette }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '1.25rem',
    height: '1.25rem',
    color: palette.text.secondary,
    '& .MuiSvgIcon-root': { fontSize: '1rem', color: iconColor },
    '& .MuiCircularProgress-root': { marginLeft: 0 },
  }),
});

export default ScheduleRunStatusChip;
