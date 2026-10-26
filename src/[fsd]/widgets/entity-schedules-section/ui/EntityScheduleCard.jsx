import { memo, useCallback, useState } from 'react';

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
import { Button, Modal } from '@/[fsd]/shared/ui';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import EditIcon from '@/components/Icons/EditIcon';

import EntityScheduleCardLine from './EntityScheduleCardLine';

const WIDE = '@container (min-width: 30rem)';

const EntityScheduleCard = memo(props => {
  const { row, entityType, currentUserId, onOpenForm, onOpenRunHistory } = props;
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

  const allowed = row.allowed_actions;
  const rule = ScheduleHelpers.getCronSummaryInBrowserTimezone(row.cron, row.timezone);
  const timezone = ScheduleHelpers.getBrowserTimezone() ?? row.timezone;
  const lastRun = row.last_run ? formatRunStarted(row.last_run) : 'Never run';
  const nextRun = row.enabled ? (row.next_run && formatRunStarted(row.next_run)) || '-' : 'Paused';
  // The list API sends only the user's own rows to a non-admin, so another owner shows for admins only
  const isYou = row.owner?.id != null && row.owner.id === currentUserId;
  const owner = isYou ? 'You' : row.owner?.name;
  const testId = `${entityType}-schedule-card`;

  const styles = entityScheduleCardStyles();

  return (
    <Box
      role="group"
      aria-label={row.name}
      sx={styles.card}
      data-testid={`${testId}-${row.id}`}
    >
      <EntityScheduleCardLine
        area="title"
        text={rule}
        testId={`${testId}-rule-${row.id}`}
        isTitle
      />
      <Typography
        component="span"
        sx={styles.timezoneHint}
      >
        {`Shown: ${timezone}`}
      </Typography>
      <EntityScheduleCardLine
        area="last"
        label="Last run"
        text={lastRun}
        chip={
          // A status without a run time is stale data: "Never run" carries no chip
          row.last_run &&
          row.last_run_status && (
            <ScheduleRunStatusChip
              status={row.last_run_status}
              variant="text"
            />
          )
        }
      />
      <EntityScheduleCardLine
        area="next"
        label="Next run"
        text={nextRun}
        testId={`${testId}-next-${row.id}`}
      />
      <EntityScheduleCardLine
        area="name"
        label="Name"
        text={row.name}
      />
      {owner && (
        <EntityScheduleCardLine
          area="owner"
          label="Owner"
          text={owner}
        />
      )}
      <Box sx={styles.footer}>
        {allowed?.includes('edit') && (
          <Button.BaseBtn
            variant={Button.BUTTON_VARIANTS.tertiary}
            size="small"
            aria-label={`Edit ${row.name}`}
            disabled={actions.isBusy}
            startIcon={<EditIcon fill="currentColor" />}
            onClick={onEdit}
          />
        )}
        {allowed?.includes('delete') && (
          <Button.BaseBtn
            variant={Button.BUTTON_VARIANTS.tertiary}
            size="small"
            aria-label={`Delete ${row.name}`}
            disabled={actions.isBusy}
            startIcon={<DeleteIcon fill="currentColor" />}
            onClick={onDeleteClick}
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
          // The edit page shows the runs of the schedule beside the form
          onOpenRunHistory={onHistory}
          hideChangeOwner
        />
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
    </Box>
  );
});

EntityScheduleCard.displayName = 'EntityScheduleCard';

/** @type {MuiSx} */
const entityScheduleCardStyles = () => ({
  // The toolkit Schedule card look. The section is the container: below 30 rem each item has its own line
  // and the actions sit in a right-aligned footer; from 30 rem the lines use two columns, actions at the right.
  card: ({ palette }) => ({
    containerType: 'inline-size',
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr)',
    gridTemplateAreas: `
      "title"
      "shown"
      "last"
      "next"
      "name"
      "owner"
      "footer"`,
    alignItems: 'center',
    rowGap: '0.25rem',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.surface.interactive.default,
    [WIDE]: {
      gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) auto',
      gridTemplateAreas: `
        "title title footer"
        "shown shown footer"
        "last  next  footer"
        "name  owner footer"`,
      columnGap: '1rem',
    },
  }),
  // The timezoneHint of the toolkit Schedule card (RunIndexScheduleContent): same size, italic, wraps
  timezoneHint: ({ palette }) => ({
    gridArea: 'shown',
    fontStyle: 'italic',
    fontSize: '0.675rem',
    color: palette.icon.secondary,
    whiteSpace: 'pre-line',
  }),
  footer: {
    gridArea: 'footer',
    justifySelf: 'end',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
});

export default EntityScheduleCard;
