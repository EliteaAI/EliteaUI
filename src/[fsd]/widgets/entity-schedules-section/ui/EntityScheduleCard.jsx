import { memo, useCallback } from 'react';

import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import ErrorOutline from '@mui/icons-material/ErrorOutline';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import WarningAmber from '@mui/icons-material/WarningAmber';
import { Box, Chip, Typography } from '@mui/material';

import { ScheduleEnabledSwitch, ScheduleRowActions, useScheduleRowActions } from '@/[fsd]/features/schedule';
import { toWord } from '@/[fsd]/features/schedule/lib/helpers';
import {
  getBrowserTimezone,
  getCronSummaryInBrowserTimezone,
} from '@/[fsd]/shared/lib/helpers/schedule.helpers';
import ClockIcon from '@/assets/clock.svg?react';

// The last-run chip: an icon plus the status text (R2.6)
const STATUS_CHIPS = {
  success: { color: 'success', Icon: CheckCircleOutline },
  failed: { color: 'error', Icon: ErrorOutline },
  blocked: { color: 'error', Icon: ErrorOutline },
  waiting_for_approval: { color: 'warning', Icon: WarningAmber },
};
const OTHER_STATUS_CHIP = { color: 'default', Icon: InfoOutlined };

const formatDateTime = value =>
  new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });

const EntityScheduleCard = memo(props => {
  const { row, entityType, currentUserId, onOpenForm } = props;
  const actions = useScheduleRowActions(row);
  const onEdit = useCallback(() => onOpenForm(row.id), [onOpenForm, row.id]);

  // The list API sends only the user's own rows to a non-admin, so another owner shows for admins only
  const ownerLabel = row.owner?.id === currentUserId ? 'You' : row.owner?.name;
  const details = [
    getCronSummaryInBrowserTimezone(row.cron, row.timezone),
    getBrowserTimezone() ?? row.timezone,
    row.last_run && `Last run: ${formatDateTime(row.last_run)}`,
    row.next_run && `Next: ${formatDateTime(row.next_run)}`,
    ownerLabel,
  ]
    .filter(Boolean)
    .join(' · ');
  const { color, Icon } = STATUS_CHIPS[row.last_run_status] ?? OTHER_STATUS_CHIP;
  const testId = `${entityType}-schedule-card`;

  const styles = entityScheduleCardStyles();

  return (
    <Box
      sx={styles.card}
      data-testid={`${testId}-${row.id}`}
    >
      <Box sx={styles.header}>
        <Box
          component={ClockIcon}
          sx={styles.icon}
          aria-hidden
        />
        <Typography
          variant="labelMedium"
          sx={styles.name}
        >
          {row.name}
        </Typography>
        {row.last_run_status && (
          <Chip
            size="small"
            variant="outlined"
            color={color}
            icon={<Icon />}
            label={toWord(row.last_run_status)}
            data-testid={`${testId}-status-${row.id}`}
          />
        )}
        <ScheduleEnabledSwitch
          row={row}
          testId={`${testId}-toggle-${row.id}`}
        />
        <ScheduleRowActions
          row={row}
          {...actions}
          onEdit={onEdit}
          // The edit page shows the runs of the schedule beside the form (R5.5)
          onOpenRunHistory={onEdit}
          hideChangeOwner
        />
      </Box>
      <Typography
        variant="bodySmall"
        color="text.secondary"
        data-testid={`${testId}-details-${row.id}`}
      >
        {details}
      </Typography>
    </Box>
  );
});

EntityScheduleCard.displayName = 'EntityScheduleCard';

/** @type {MuiSx} */
const entityScheduleCardStyles = () => ({
  card: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.default.secondary,
  }),
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  icon: ({ palette }) => ({
    width: '1rem',
    height: '1rem',
    flexShrink: 0,
    color: palette.icon.default,
  }),
  name: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
});

export default EntityScheduleCard;
