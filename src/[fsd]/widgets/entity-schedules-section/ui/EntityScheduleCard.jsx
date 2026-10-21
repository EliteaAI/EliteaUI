import { memo, useCallback, useState } from 'react';

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
import { useDeleteConfirmationDisabled } from '@/[fsd]/shared/lib/hooks/useDeleteConfirmationDisabled.hooks';
import { Button, Modal } from '@/[fsd]/shared/ui';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import EditIcon from '@/components/Icons/EditIcon';

const WIDE = '@container (min-width: 30rem)';

// One labelled line: the value truncates with a tooltip, the label stays whole
const CardLine = memo(props => {
  const { label, area, testId, focusable, isTitle, text, chip } = props;
  const styles = entityScheduleCardStyles();

  return (
    <Box sx={[styles.lineRow, { gridArea: area }]}>
      {label && (
        <Typography
          variant="bodySmall"
          color="text.secondary"
          component="span"
          sx={styles.label}
        >
          {`${label}: `}
        </Typography>
      )}
      <Tooltip
        title={text}
        placement="top"
      >
        <Typography
          variant={isTitle ? 'labelMedium' : 'bodySmall'}
          component="span"
          tabIndex={focusable ? 0 : undefined}
          sx={[styles.line, isTitle && styles.title]}
          data-testid={testId}
        >
          {text}
        </Typography>
      </Tooltip>
      {chip}
    </Box>
  );
});

CardLine.displayName = 'CardLine';

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
  const rule = getCronSummaryInBrowserTimezone(row.cron, row.timezone);
  const timezone = getBrowserTimezone() ?? row.timezone;
  const lastRun = row.last_run ? formatRunStarted(row.last_run) : 'Never run';
  const nextRun = row.enabled ? (row.next_run && formatRunStarted(row.next_run)) || '-' : 'Paused';
  // The list API sends only the user's own rows to a non-admin, so another owner shows for admins only
  const owner = row.owner?.id === currentUserId ? 'You' : row.owner?.name;
  const testId = `${entityType}-schedule-card`;

  const styles = entityScheduleCardStyles();

  return (
    <Box
      role="group"
      aria-label={row.name}
      sx={styles.card}
      data-testid={`${testId}-${row.id}`}
    >
      <CardLine
        area="title"
        text={rule}
        testId={`${testId}-rule-${row.id}`}
        isTitle
      />
      <CardLine
        area="shown"
        label="Shown"
        text={timezone}
      />
      <CardLine
        area="last"
        label="Last run"
        text={lastRun}
        chip={
          row.last_run_status && (
            <ScheduleRunStatusChip
              status={row.last_run_status}
              variant="text"
            />
          )
        }
      />
      <CardLine
        area="next"
        label="Next run"
        text={nextRun}
        testId={`${testId}-next-${row.id}`}
      />
      <CardLine
        area="name"
        label="Name"
        text={row.name}
        focusable
      />
      <CardLine
        area="owner"
        label="Owner"
        text={owner}
      />
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
          // The edit page shows the runs of the schedule beside the form (R5.5)
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
  // A container: below 30 rem each item has its own line and the actions sit in a right-aligned footer;
  // from 30 rem the lines use two columns and the actions sit at the right.
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
    border: `0.0625rem solid ${palette.border.lines}`,
    backgroundColor: palette.background.default.secondary,
    [WIDE]: {
      gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) auto',
      gridTemplateAreas: `
        "title shown footer"
        "last  next  footer"
        "name  owner footer"`,
      columnGap: '1rem',
    },
  }),
  lineRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    minWidth: 0,
  },
  label: { flexShrink: 0 },
  line: {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  title: { fontWeight: 600 },
  footer: {
    gridArea: 'footer',
    justifySelf: 'end',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
});

export default EntityScheduleCard;
