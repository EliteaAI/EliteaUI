import { forwardRef, memo, useId, useMemo } from 'react';

import { Box, Chip, Typography } from '@mui/material';

import { buildEntityEditorLink } from '@/[fsd]/entities/schedule';
import { ChatContinue, ToolkitActionPanel } from '@/[fsd]/features/chat';
import { useMcpTokenChange } from '@/[fsd]/features/mcp';
import { NavigationHelpers } from '@/[fsd]/shared/lib/helpers';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { BaseBtn } from '@/[fsd]/shared/ui/button';
import { SearchParams, ViewMode } from '@/common/constants';
import RouteDefinitions from '@/routes';

import { WAITING_NEED, formatApprovalExpiry, getWaitingRunNeed } from '../lib/helpers';
import { useActionButtonProps } from '../lib/hooks/useActionButtonProps.hooks';
import { useNow } from '../lib/hooks/useNow.hooks';
import { useScheduleRun, useScheduleRunConversation } from '../lib/hooks/useScheduleRuns.hooks';
import {
  CREDENTIAL_CHECK_STATE,
  useWaitingRunCredentialCheck,
} from '../lib/hooks/useWaitingRunCredentialCheck.hooks';
import ScheduleRunApproval from './ScheduleRunApproval';

const noop = () => {};
const STEP2_NOTE = 'Reject ends the run as Failed: rejected by the owner.';
const BLOCKED_REASON = 'Provide the credential first';
const NEW_TAB = { target: '_blank', rel: 'noopener noreferrer' };
const ENTITY_LABELS = { agent: 'agent', pipeline: 'pipeline' };
const STEP_STATUS = {
  missing: { label: 'Missing', tone: 'warning' },
  checking: { label: 'Checking', tone: 'info' },
  ready: { label: 'Done', tone: 'success' },
};

const describeNeed = ({ need, toolkit, credential }, pausedText) => {
  const name = toolkit || 'the toolkit';
  if (need === WAITING_NEED.SIGN_IN) return `Toolkit "${name}" needs you to sign in.`;
  if (need === WAITING_NEED.CREDENTIAL)
    return credential
      ? `Toolkit "${name}" has no usable credential "${credential}".`
      : `Toolkit "${name}" has no usable credential.`;
  return pausedText || 'This run is paused and waits for your decision.';
};

/**
 * The "Action needed" card of the schedule page. It takes the place of the Test schedule panel while a run
 * waits for approval. A run that waits for a credential gets two steps: provide the credential, then approve.
 * Approve stays off until the risk check of the schedule finds the credential. A run that waits for a sign-in
 * has the sign-in button as step 1. `run` is a row of the runs list; `onShowTest` switches back to the Test panel.
 */
const ScheduleWaitingCard = memo(
  forwardRef((props, ref) => {
    const { schedule, run, onShowTest } = props;
    const projectId = useSelectedProjectId();
    const now = useNow();
    const statusId = useId();
    const { run: detail } = useScheduleRun(schedule.id, run.id);
    const shownRun = detail ?? run;
    const conversation = useScheduleRunConversation(shownRun);
    const pausedEvent = useMemo(() => detail?.events?.findLast(event => event.kind === 'paused'), [detail]);
    const waiting = useMemo(() => getWaitingRunNeed(pausedEvent), [pausedEvent]);
    const isCredential = waiting.need === WAITING_NEED.CREDENTIAL;
    const isSignIn = waiting.need === WAITING_NEED.SIGN_IN;
    const { authAction } = conversation;

    const {
      state: credentialState,
      recheck,
      toolkitName,
    } = useWaitingRunCredentialCheck({
      schedule,
      toolkit: waiting.toolkit,
      enabled: isCredential,
    });
    const serverUrl = authAction?.toolOutputs?.server_url || authAction?.toolMeta?.server_url || '';
    const { isLoggedIn: signedIn } = useMcpTokenChange({ serverUrl });
    const stepState = isSignIn
      ? signedIn
        ? CREDENTIAL_CHECK_STATE.READY
        : CREDENTIAL_CHECK_STATE.MISSING
      : credentialState;
    const status = STEP_STATUS[stepState];

    // Both links open a new tab, so this page keeps its state; the URL needs the origin and the project segment
    const credentialsLink = NavigationHelpers.buildAbsoluteAppUrl(
      projectId,
      RouteDefinitions.CreateCredentialFromMain,
    );
    const entityLink = buildEntityEditorLink({
      entityType: schedule.entity_type,
      entityId: schedule.application_id,
    });
    const editorLink = NavigationHelpers.buildAbsoluteAppUrl(
      projectId,
      `${schedule.version_id ? `${entityLink}/${schedule.version_id}` : entityLink}?${SearchParams.ViewMode}=${ViewMode.Owner}`,
    );
    const entityLabel = ENTITY_LABELS[schedule.entity_type] ?? 'agent';
    const expiry = formatApprovalExpiry(
      { expiresAt: shownRun.approval_expires_at, pausedAt: pausedEvent?.at },
      now,
    );

    const description = describeNeed(
      { ...waiting, toolkit: waiting.toolkit || toolkitName },
      pausedEvent?.text,
    );
    const toolkitLabel = waiting.toolkit || toolkitName || 'the toolkit';
    const authorizationText = `Authorization is required for toolkit "${toolkitLabel}". Provide the credential, then approve.`;
    const signInText = `Authorization is required for toolkit "${toolkitLabel}". Authorize now, then approve.`;
    const credentialRows = [
      ['Toolkit', toolkitLabel],
      ['Credential', waiting.credential],
      ['Status', status.label],
    ].filter(([, value]) => value);
    const step1Title = (
      <Box sx={scheduleWaitingCardStyles().stepHeader}>
        ⚠️ Step 1: Toolkit Authorization Required
        <Chip
          data-testid="schedule-waiting-step1-status"
          size="small"
          variant="outlined"
          label={status.label}
          sx={scheduleWaitingCardStyles().chip[status.tone]}
        />
      </Box>
    );
    const buttonProps = useActionButtonProps();
    const styles = scheduleWaitingCardStyles();

    return (
      <Box
        ref={ref}
        data-testid="schedule-waiting-card"
        component="section"
        aria-labelledby={`${statusId}-title`}
        sx={styles.root}
      >
        <Box sx={styles.header}>
          <Typography
            id={`${statusId}-title`}
            component="h2"
            sx={styles.title}
          >
            Action needed: this run is waiting for you
          </Typography>
          <BaseBtn
            variant="elitea"
            color="secondary"
            onClick={onShowTest}
          >
            Test schedule
          </BaseBtn>
        </Box>
        <Box sx={styles.body}>
          {expiry && (
            <Typography
              data-testid="schedule-waiting-expiry"
              variant="bodySmall"
              color="text.secondary"
            >
              {expiry}
            </Typography>
          )}
          {isSignIn && authAction && (
            <ChatContinue
              authRequiredAction={authAction}
              title={step1Title}
              authorizationText={signInText}
              hideContinue
              authorizeProps={buttonProps.primary}
              detailsExpanded
              onContinue={noop}
            />
          )}
          {isCredential && (
            <ToolkitActionPanel
              title={step1Title}
              message={authorizationText}
              detailRows={credentialRows}
              defaultExpanded
              role="status"
              sx={styles.panel}
            >
              <BaseBtn
                component="a"
                href={credentialsLink}
                {...buttonProps.secondary}
                sx={styles.button}
                {...NEW_TAB}
              >
                Open credentials
              </BaseBtn>
              <BaseBtn
                component="a"
                href={editorLink}
                {...buttonProps.secondary}
                sx={styles.button}
                {...NEW_TAB}
              >
                {`Open ${entityLabel} editor`}
              </BaseBtn>
              <BaseBtn
                {...buttonProps.secondary}
                sx={styles.button}
                disabled={credentialState === CREDENTIAL_CHECK_STATE.CHECKING}
                onClick={recheck}
              >
                Check again
              </BaseBtn>
            </ToolkitActionPanel>
          )}
          <ToolkitActionPanel
            title={`⚠️ ${isCredential || isSignIn ? 'Step 2: Approve to continue from the paused step' : 'Decide'}`}
            message={isCredential || isSignIn ? STEP2_NOTE : `${description} ${STEP2_NOTE}`}
            sx={styles.panel}
          >
            <ScheduleRunApproval
              compact
              schedule={schedule}
              runId={shownRun.id}
              hasChat={shownRun.conversation_id != null}
              conversationUuid={conversation.conversationUuid}
              pausedMessageId={conversation.pausedMessageId}
              authAction={authAction}
              pausedAt={pausedEvent?.at}
              blockedReason={
                isCredential && credentialState !== CREDENTIAL_CHECK_STATE.READY ? BLOCKED_REASON : undefined
              }
            />
          </ToolkitActionPanel>
        </Box>
      </Box>
    );
  }),
);

ScheduleWaitingCard.displayName = 'ScheduleWaitingCard';

const toneChip = (palette, tone) => ({
  color: palette.alert[tone].text,
  borderColor: palette.alert[tone].border,
  backgroundColor: palette.alert[tone].background,
});

/** @type {MuiSx} */
const scheduleWaitingCardStyles = () => ({
  root: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '1rem 1.5rem',
    borderRadius: '1rem',
    border: `0.0625rem solid ${palette.warning.main}`,
    backgroundColor: palette.background.default.tertiary,
    scrollMarginTop: '4.5rem',
  }),
  // Dark theme keeps the approved chat surface; light theme uses the lighter one, as the card is grey already
  panel: ({ palette }) =>
    palette.mode === 'light' ? { background: palette.background.surface.interactive.default } : {},
  button: { width: 'auto !important' },
  header: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' },
  title: ({ palette }) => ({
    flex: '1 1 auto',
    fontSize: '1.125rem',
    fontWeight: 600,
    color: palette.text.primary,
  }),
  body: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  stepHeader: { display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' },
  chip: {
    warning: ({ palette }) => toneChip(palette, 'warning'),
    info: ({ palette }) => toneChip(palette, 'info'),
    success: ({ palette }) => toneChip(palette, 'success'),
  },
});

export default ScheduleWaitingCard;
