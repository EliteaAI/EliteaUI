import { Fragment, memo, useCallback, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { formatRunTimestamp } from '@/[fsd]/entities/run-history';
import { isWebhookRow, toKindNoun } from '@/[fsd]/entities/schedule';
import { ScheduleMandateConsent } from '@/[fsd]/features/owner-consent';
import { GovernanceReadinessCard } from '@/[fsd]/features/project-governance';
import {
  ScheduleEnabledSwitch,
  ScheduleRowActions,
  ScheduleRunStatusChip,
  isRotating,
  rotationText,
  toFullWebhookUrl,
  toWebhookTypeLabel,
  useNow,
  useScheduleRowActions,
} from '@/[fsd]/features/schedule';
import { ScheduleHelpers } from '@/[fsd]/shared/lib/helpers';
import { useDeleteConfirmationDisabled } from '@/[fsd]/shared/lib/hooks';
import { Modal } from '@/[fsd]/shared/ui';
import { CopyValueField } from '@/[fsd]/shared/ui/webhook';

import EntityScheduleCardLine from './EntityScheduleCardLine';

// The card shows the day only, as the mockup does
const CARD_DATE_FORMAT = 'dd.MM.yyyy';
const formatCardDate = value => formatRunTimestamp(value, CARD_DATE_FORMAT);

const stopPropagation = event => event.stopPropagation();

// A running schedule has no finished run time to show, only the status
const lastRunText = row => {
  if (!row.last_run) return isWebhookRow(row) ? 'No deliveries yet' : 'Never run';
  return row.last_run_status === 'running' ? '' : formatCardDate(row.last_run);
};

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

  // The card opens the details page for a user who may edit; the list API sends other rows read-only
  const isOpenable = Boolean(row.allowed_actions?.includes('edit'));
  const rule = ScheduleHelpers.getCronSummaryInBrowserTimezone(row.cron, row.timezone);
  const timezone = ScheduleHelpers.getBrowserTimezone() ?? row.timezone;
  const nextRun = row.enabled ? (row.next_run && formatCardDate(row.next_run)) || '-' : 'Not scheduled';
  // The list API sends only the user's own rows to a non-admin
  const isYou = row.owner?.id != null && row.owner.id === currentUserId;
  const showChip = Boolean(row.last_run && row.last_run_status);
  const isWebhook = isWebhookRow(row);
  // Ticks each minute on webhook cards only, so the rotation note goes when the window ends
  const now = useNow(isWebhook);
  const testId = `${entityType}-${toKindNoun(row.trigger_kind)}-card`;

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
        {isWebhook ? (
          <EntityScheduleCardLine
            text={`${row.name} · ${toWebhookTypeLabel(row)}`}
            testId={`${testId}-title-${row.id}`}
            onActivate={isOpenable ? onEdit : undefined}
            isTitle
          />
        ) : (
          <>
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
          </>
        )}
        {isWebhook && (
          <Box onClick={stopPropagation}>
            <CopyValueField
              compact
              label="URL"
              value={toFullWebhookUrl(row.webhook_url)}
              testId={`${testId}-url-${row.id}`}
            />
          </Box>
        )}
        <EntityScheduleCardLine
          label={isWebhook ? 'Last delivery' : 'Last run'}
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
        {isWebhook ? (
          isRotating(row, now) && (
            <Typography
              variant="bodySmall2"
              color="text.secondary"
              data-testid={`${testId}-rotating-${row.id}`}
            >
              {rotationText(row)}
            </Typography>
          )
        ) : (
          <EntityScheduleCardLine
            label="Next run"
            text={nextRun}
            testId={`${testId}-next-${row.id}`}
          />
        )}
        {/* Buttons inside the consent and the readiness card must not open the schedule */}
        <Box onClick={stopPropagation}>
          <ScheduleMandateConsent
            versionId={row.version_id}
            isOwner={isYou}
          />
        </Box>
        {/* The owner's Save card: the mandate, its grants and consent this schedule still needs */}
        {isYou && (
          <Box onClick={stopPropagation}>
            <GovernanceReadinessCard
              entityKind="schedule"
              entityId={row.id}
              testId={`${testId}-readiness-${row.id}`}
            />
          </Box>
        )}
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
