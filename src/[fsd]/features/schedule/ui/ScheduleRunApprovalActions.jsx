import { memo, useCallback, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { isWebhookRow } from '@/[fsd]/entities/schedule';
import { BaseBtn } from '@/[fsd]/shared/ui/button';

import { describeRunNoteActions, getRunNoteActions } from '../lib/helpers';
import { useActionButtonProps } from '../lib/hooks/useActionButtonProps.hooks';
import { useScheduleRowActions } from '../lib/hooks/useScheduleRowActions.hooks';
import { useTestRunAsCaller } from '../lib/hooks/useTestRunAsCaller.hooks';
import ChangeOwnerDialog from './ChangeOwnerDialog';

/**
 * The note of a viewer who may not decide a run that acts as the schedule owner, with what the viewer can do
 * instead: pause or resume, change the owner, start a new run as themselves. Each action shows when the server
 * lists it in `allowed_actions` of the schedule. `note` is the first sentence; the second one names the actions.
 * A webhook row starts its sample run, which acts as the caller; a schedule starts a Test run of its saved body.
 */
const ScheduleRunApprovalActions = memo(props => {
  const { schedule, note } = props;
  const rowActions = useScheduleRowActions(schedule);
  const testRun = useTestRunAsCaller(schedule);
  const buttonProps = useActionButtonProps();
  const [isOwnerDialogOpen, setIsOwnerDialogOpen] = useState(false);
  const openOwnerDialog = useCallback(() => setIsOwnerDialogOpen(true), []);
  const closeOwnerDialog = useCallback(() => setIsOwnerDialogOpen(false), []);

  const isWebhook = isWebhookRow(schedule);
  const actions = getRunNoteActions(schedule);
  const busy = rowActions.isBusy || testRun.pending;
  const options = describeRunNoteActions(actions, isWebhook ? 'webhook' : 'schedule');
  const styles = scheduleRunApprovalActionsStyles();

  return (
    <Box
      data-testid="schedule-run-approval-actions"
      sx={styles.root}
    >
      <Typography
        variant="bodySmall"
        color="text.secondary"
      >
        {options ? `${note} ${options}` : note}
      </Typography>
      {actions.length > 0 && (
        <Box sx={styles.buttons}>
          {actions.includes('pause') && (
            <BaseBtn
              {...buttonProps.secondary}
              sx={styles.button}
              data-testid="schedule-run-approval-pause"
              disabled={busy}
              onClick={rowActions.onPause}
            >
              {isWebhook ? 'Pause webhook' : 'Pause schedule'}
            </BaseBtn>
          )}
          {actions.includes('resume') && (
            <BaseBtn
              {...buttonProps.secondary}
              sx={styles.button}
              data-testid="schedule-run-approval-resume"
              disabled={busy}
              onClick={rowActions.onResume}
            >
              {isWebhook ? 'Resume webhook' : 'Resume schedule'}
            </BaseBtn>
          )}
          {actions.includes('change_owner') && (
            <BaseBtn
              {...buttonProps.secondary}
              sx={styles.button}
              data-testid="schedule-run-approval-change-owner"
              disabled={busy}
              onClick={openOwnerDialog}
            >
              Change owner
            </BaseBtn>
          )}
          {actions.includes('run') && (
            <BaseBtn
              {...buttonProps.secondary}
              sx={styles.button}
              data-testid="schedule-run-approval-new-run"
              disabled={busy}
              onClick={isWebhook ? rowActions.onRun : testRun.start}
            >
              Start a new run as yourself
            </BaseBtn>
          )}
        </Box>
      )}
      {isOwnerDialogOpen && (
        <ChangeOwnerDialog
          open
          schedule={{
            id: schedule.id,
            name: schedule.name,
            owner: schedule.owner,
            trigger_kind: schedule.trigger_kind,
          }}
          onClose={closeOwnerDialog}
        />
      )}
    </Box>
  );
});

ScheduleRunApprovalActions.displayName = 'ScheduleRunApprovalActions';

/** @type {MuiSx} */
const scheduleRunApprovalActionsStyles = () => ({
  root: { display: 'flex', flexDirection: 'column', gap: '0.5rem', flexBasis: '100%' },
  buttons: { display: 'flex', flexWrap: 'wrap', gap: '0.75rem' },
  button: { width: 'auto !important' },
});

export default ScheduleRunApprovalActions;
