import { memo, useCallback } from 'react';

import { Box, Typography } from '@mui/material';

import {
  ScheduleEnabledSwitch,
  ScheduleRowActions,
  ScheduleRunStatusChip,
  formatRunStarted,
  useScheduleRowActions,
} from '@/[fsd]/features/schedule';
import {
  getBrowserTimezone,
  getCronSummaryInBrowserTimezone,
} from '@/[fsd]/shared/lib/helpers/schedule.helpers';
import ClockIcon from '@/assets/clock.svg?react';

const EntityScheduleCard = memo(props => {
  const { row, entityType, currentUserId, onOpenForm } = props;
  const actions = useScheduleRowActions(row);
  const onEdit = useCallback(() => onOpenForm(row.id), [onOpenForm, row.id]);

  // The list API sends only the user's own rows to a non-admin, so another owner shows for admins only
  const ownerLabel = row.owner?.id === currentUserId ? 'You' : row.owner?.name;
  const details = [
    getCronSummaryInBrowserTimezone(row.cron, row.timezone),
    getBrowserTimezone() ?? row.timezone,
    row.last_run && `Last run: ${formatRunStarted(row.last_run)}`,
    row.next_run && `Next: ${formatRunStarted(row.next_run)}`,
    ownerLabel,
  ]
    .filter(Boolean)
    .join(' · ');
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
        {/* The last-run chip of the Runs panel (R2.6) */}
        {row.last_run_status && <ScheduleRunStatusChip status={row.last_run_status} />}
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
