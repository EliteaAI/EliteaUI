import { memo } from 'react';

import BlockIcon from '@mui/icons-material/Block';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import TimerOffOutlinedIcon from '@mui/icons-material/TimerOffOutlined';
import { Chip, CircularProgress } from '@mui/material';

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
  const { status } = props;

  const { Icon, color } = STATUS_ICONS[status] ?? {};
  const styles = scheduleRunStatusChipStyles(color);

  const icon =
    status === 'running' ? (
      <CircularProgress
        size="0.75rem"
        sx={styles.progress}
      />
    ) : (
      Icon && <Icon />
    );

  return (
    <Chip
      data-testid="schedule-run-status"
      size="small"
      variant="outlined"
      icon={icon || undefined}
      label={toRunStatusLabel(status) || '-'}
      sx={styles.chip}
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
});

export default ScheduleRunStatusChip;
