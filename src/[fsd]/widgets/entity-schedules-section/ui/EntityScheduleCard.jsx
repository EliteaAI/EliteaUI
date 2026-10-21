import { memo, useCallback } from 'react';

import { Box, Tooltip, Typography } from '@mui/material';

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

const WIDE = '@container (min-width: 26rem)';

const EntityScheduleCard = memo(props => {
  const { row, entityType, currentUserId, onOpenForm, onOpenRunHistory } = props;
  const actions = useScheduleRowActions(row);
  const onEdit = useCallback(() => onOpenForm(row.id), [onOpenForm, row.id]);
  const onHistory = useCallback(() => onOpenRunHistory(row.id), [onOpenRunHistory, row.id]);

  // The list API sends only the user's own rows to a non-admin, so another owner shows for admins only
  const ownerLabel = row.owner?.id === currentUserId ? 'You' : row.owner?.name;
  const nextLabel = row.enabled ? row.next_run && `Next: ${formatRunStarted(row.next_run)}` : 'Paused';
  // The chip and the Runs table show the last run, so the text leaves it out (owner bug 2026-10-21)
  const rule = [getCronSummaryInBrowserTimezone(row.cron, row.timezone), getBrowserTimezone() ?? row.timezone]
    .filter(Boolean)
    .join(' · ');
  const next = [nextLabel, ownerLabel].filter(Boolean).join(' · ');
  const meta = [rule, next].filter(Boolean).join(' · ');
  const testId = `${entityType}-schedule-card`;

  const styles = entityScheduleCardStyles();

  return (
    <Box
      role="group"
      aria-label={`${row.name}, ${meta}`}
      sx={styles.card}
      data-testid={`${testId}-${row.id}`}
    >
      <Box
        component={ClockIcon}
        sx={styles.icon}
        aria-hidden
      />
      <Tooltip
        title={row.name}
        placement="top"
      >
        <Typography
          variant="labelMedium"
          tabIndex={0}
          sx={[styles.line, styles.name]}
        >
          {row.name}
        </Typography>
      </Tooltip>
      {/* The last-run chip of the Runs panel (R2.6) */}
      {row.last_run_status && (
        <Box sx={styles.chip}>
          <ScheduleRunStatusChip status={row.last_run_status} />
        </Box>
      )}
      <Box sx={styles.switch}>
        <ScheduleEnabledSwitch
          row={row}
          testId={`${testId}-toggle-${row.id}`}
        />
      </Box>
      <Box sx={styles.menu}>
        <ScheduleRowActions
          row={row}
          {...actions}
          onEdit={onEdit}
          // The edit page shows the runs of the schedule beside the form (R5.5)
          onOpenRunHistory={onHistory}
          hideChangeOwner
        />
      </Box>
      <Tooltip
        title={rule}
        placement="top"
      >
        <Typography
          variant="bodySmall"
          color="text.secondary"
          sx={[styles.line, styles.rule]}
          data-testid={`${testId}-rule-${row.id}`}
        >
          {rule}
        </Typography>
      </Tooltip>
      <Tooltip
        title={next}
        placement="top"
      >
        <Typography
          variant="bodySmall"
          color="text.secondary"
          sx={[styles.line, styles.next]}
          data-testid={`${testId}-next-${row.id}`}
        >
          {next}
        </Typography>
      </Tooltip>
    </Box>
  );
});

EntityScheduleCard.displayName = 'EntityScheduleCard';

/** @type {MuiSx} */
const entityScheduleCardStyles = () => ({
  // A container: below 26 rem three lines (name, chip and rule, next run), from 26 rem the chip joins
  // the first line and the meta is one line. One set of nodes keeps the tab order name, switch, menu.
  card: ({ palette }) => ({
    containerType: 'inline-size',
    display: 'grid',
    gridTemplateColumns: '1rem auto minmax(0, max-content) minmax(0, 1fr) auto auto auto',
    gridTemplateAreas: `
      "icon name name name name switch menu"
      ".    chip rule rule rule rule   rule"
      ".    next next next next next   next"`,
    alignItems: 'center',
    rowGap: '0.25rem',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    backgroundColor: palette.background.default.secondary,
    [WIDE]: {
      gridTemplateAreas: `
        "icon name name name chip switch menu"
        ".    rule rule next next next   next"`,
    },
  }),
  icon: ({ palette }) => ({
    gridArea: 'icon',
    width: '1rem',
    height: '1rem',
    color: palette.icon.default,
  }),
  line: {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  name: {
    gridArea: 'name',
    marginLeft: '0.5rem',
  },
  chip: {
    gridArea: 'chip',
    display: 'flex',
    marginLeft: '0.5rem',
    [WIDE]: {
      marginRight: '0.5rem',
    },
  },
  switch: {
    gridArea: 'switch',
    display: 'flex',
    marginLeft: '0.5rem',
  },
  menu: {
    gridArea: 'menu',
    display: 'flex',
    marginLeft: '0.25rem',
  },
  rule: {
    gridArea: 'rule',
    marginLeft: '0.5rem',
  },
  next: {
    gridArea: 'next',
    marginLeft: '0.5rem',
    [WIDE]: {
      marginLeft: 0,
      '&::before': {
        content: '"\\00a0·\\00a0"',
      },
    },
  },
});

export default EntityScheduleCard;
