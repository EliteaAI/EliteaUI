import { Fragment, memo, useCallback, useState } from 'react';

import { Box, Typography } from '@mui/material';

import {
  ScheduleEnabledSwitch,
  ScheduleRowActions,
  ScheduleRunStatusChip,
  formatRunStarted,
  useScheduleRowActions,
} from '@/[fsd]/features/schedule';
import { ScheduleHelpers } from '@/[fsd]/shared/lib/helpers';
import { useDeleteConfirmationDisabled } from '@/[fsd]/shared/lib/hooks';
import { Modal } from '@/[fsd]/shared/ui';

import EntityScheduleCardLine from './EntityScheduleCardLine';

const stopPropagation = event => event.stopPropagation();

// A running schedule has no finished run time to show, only the status
const lastRunText = row => {
  if (!row.last_run) return 'Never run';
  return row.last_run_status === 'running' ? '' : formatRunStarted(row.last_run);
};

const EntityScheduleCard = memo(props => {
  const { row, entityType, onOpenForm, onOpenRunHistory } = props;
  const actions = useScheduleRowActions(row);
  const skipConfirmation = useDeleteConfirmationDisabled();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const onEdit = useCallback(() => onOpenForm(row.id), [onOpenForm, row.id]);
  const onHistory = useCallback(() => onOpenRunHistory(row.id), [onOpenRunHistory, row.id]);
  const onDeleteClick = useCallback(
    () => (skipConfirmation ? actions.onDelete() : setIsDeleteOpen(true)),
    [skipConfirmation, actions],
  );
  const closeDelete = useCallback(() => setIsDeleteOpen(false), []);
  const confirmDelete = useCallback(() => {
    setIsDeleteOpen(false);
    actions.onDelete();
  }, [actions]);

  // The card opens the details page for a user who may edit; the list API sends other rows read-only
  const isOpenable = Boolean(row.allowed_actions?.includes('edit'));
  const rule = ScheduleHelpers.getCronSummaryInBrowserTimezone(row.cron, row.timezone);
  const timezone = ScheduleHelpers.getBrowserTimezone() ?? row.timezone;
  const nextRun = row.enabled ? (row.next_run && formatRunStarted(row.next_run)) || '-' : 'Not scheduled';
  const showChip = Boolean(row.last_run && row.last_run_status);
  const testId = `${entityType}-schedule-card`;

  const styles = entityScheduleCardStyles(isOpenable);

  return (
    <Fragment>
      <Box
        role="group"
        aria-label={row.name}
        sx={styles.card}
        data-testid={`${testId}-${row.id}`}
        onClick={isOpenable ? onEdit : undefined}
      >
        <Box sx={styles.heading}>
          <EntityScheduleCardLine
            text={rule}
            testId={`${testId}-rule-${row.id}`}
            onActivate={isOpenable ? onEdit : undefined}
            isTitle
          />
          <Typography
            variant="bodySmall2"
            component="span"
            color="text.secondary"
            sx={styles.timezone}
            data-testid={`${testId}-timezone-${row.id}`}
          >
            {`· ${timezone}`}
          </Typography>
        </Box>
        <EntityScheduleCardLine text={row.name} />
        <EntityScheduleCardLine
          label="Last run"
          text={lastRunText(row)}
          chip={
            // A status without a run time is stale data: "Never run" carries no chip
            showChip && (
              <ScheduleRunStatusChip
                status={row.last_run_status}
                variant="text"
              />
            )
          }
        />
        <EntityScheduleCardLine
          label="Next run"
          text={nextRun}
          testId={`${testId}-next-${row.id}`}
        />
        {/* The footer keeps its clicks (the menu and the dialogs render in portals) away from the card click */}
        <Box
          sx={styles.footer}
          onClick={stopPropagation}
        >
          <Box sx={styles.toggle}>
            <ScheduleEnabledSwitch
              row={row}
              testId={`${testId}-toggle-${row.id}`}
            />
            <Typography
              variant="bodySmall2"
              component="span"
              color="text.secondary"
              data-testid={`${testId}-state-${row.id}`}
            >
              {row.enabled ? 'Active' : 'Paused'}
            </Typography>
          </Box>
          <ScheduleRowActions
            row={row}
            {...actions}
            onEdit={onEdit}
            onDelete={onDeleteClick}
            onOpenRunHistory={onHistory}
            hideEdit
            hideToggle
            hideChangeOwner
          />
        </Box>
      </Box>
      {isDeleteOpen && (
        <Modal.DeleteEntityModal
          open
          name={row.name}
          shouldRequestInputName
          onClose={closeDelete}
          onConfirm={confirmDelete}
        />
      )}
    </Fragment>
  );
});

EntityScheduleCard.displayName = 'EntityScheduleCard';

/** @type {MuiSx} */
const entityScheduleCardStyles = isOpenable => ({
  card: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    backgroundColor: palette.background.surface.interactive.default,
    cursor: isOpenable ? 'pointer' : 'default',
    '&:hover': isOpenable ? { backgroundColor: palette.background.surface.interactive.active } : undefined,
  }),
  heading: {
    display: 'flex',
    alignItems: 'baseline',
    columnGap: '0.375rem',
    minWidth: 0,
  },
  timezone: { flexShrink: 0, whiteSpace: 'nowrap' },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '0.25rem',
    cursor: 'default',
  },
  toggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
});

export default EntityScheduleCard;
