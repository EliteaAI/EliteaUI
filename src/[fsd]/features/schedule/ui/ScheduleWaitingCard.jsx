import { forwardRef, memo, useId, useMemo } from 'react';

import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { Box, Chip, Typography } from '@mui/material';

import { buildEntityEditorLink } from '@/[fsd]/entities/schedule';
import { ChatContinue, ToolkitActionPanel } from '@/[fsd]/features/chat';
import { useMcpTokenChange } from '@/[fsd]/features/mcp';
import { NavigationHelpers } from '@/[fsd]/shared/lib/helpers';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { BaseBtn } from '@/[fsd]/shared/ui/button';
import { SearchParams, ViewMode } from '@/common/constants';
import RouteDefinitions from '@/routes';

import {
  WAITING_NEED,
  formatApprovalExpiry,
  getWaitingRunNeed,
  hasPendingToolsList,
  hasSeveralPendingTools,
} from '../lib/helpers';
import { useActionButtonProps } from '../lib/hooks/useActionButtonProps.hooks';
import { useNow } from '../lib/hooks/useNow.hooks';
import { useRunDetail, useScheduleRunConversation } from '../lib/hooks/useScheduleRuns.hooks';
import {
  CREDENTIAL_CHECK_STATE,
  useWaitingRunCredentialCheck,
} from '../lib/hooks/useWaitingRunCredentialCheck.hooks';
import ScheduleRunApproval from './ScheduleRunApproval';
import ScheduleWaitingTools from './ScheduleWaitingTools';

const noop = () => {};
const STEP2_NOTE = 'Reject ends the run as Failed: rejected by the owner.';
const LISTED_TOOLS_NOTE = 'Paused for approval. The tools below wait for your decision.';
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
 * The "Action needed" card of the schedule page. It opens inside a run of the Runs card that waits for approval. A run that waits for a credential gets two steps: provide the credential, then approve.
 * Approve stays off until the risk check of the schedule finds the credential. A run that waits for a sign-in
 * has the sign-in button as step 1. `run` is a row of the runs list; `onShowTest` (optional) goes back to the Runs card.
 * A Test run (`run.isDraftRun`) has no `schedule`: `entityType` and `applicationId` name the entity instead.
 */
const ScheduleWaitingCard = memo(
  forwardRef((props, ref) => {
    const { schedule, run, entityType, applicationId, onShowTest } = props;
    const projectId = useSelectedProjectId();
    const styles = scheduleWaitingCardStyles();
    const now = useNow();
    const statusId = useId();
    const { run: detail } = useRunDetail(schedule?.id, applicationId, run);
    const shownRun = detail ?? run;
    // A Test run has no schedule row: the entity comes from the page and the version from the run
    const target = useMemo(
      () =>
        schedule ?? {
          entity_type: entityType,
          application_id: applicationId,
          version_id: shownRun.version_id,
          approval_rule: detail?.approval_rule,
        },
      [schedule, entityType, applicationId, shownRun.version_id, detail?.approval_rule],
    );
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
      schedule: target,
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
      entityType: target.entity_type,
      entityId: target.application_id,
    });
    const editorLink = NavigationHelpers.buildAbsoluteAppUrl(
      projectId,
      `${target.version_id ? `${entityLink}/${target.version_id}` : entityLink}?${SearchParams.ViewMode}=${ViewMode.Owner}`,
    );
    const entityLabel = ENTITY_LABELS[target.entity_type] ?? 'agent';
    const expiry = formatApprovalExpiry(
      { expiresAt: shownRun.approval_expires_at, pausedAt: pausedEvent?.at },
      now,
    );

    // The event text ends with a short "(+N more)" tail of the same tools, so a banner with the list shows a fixed line
    const pausedText = hasPendingToolsList(pausedEvent) ? LISTED_TOOLS_NOTE : pausedEvent?.text;
    const description = describeNeed({ ...waiting, toolkit: waiting.toolkit || toolkitName }, pausedText);
    const toolkitLabel = waiting.toolkit || toolkitName || 'the toolkit';
    const authorizationText = `Authorization is required for toolkit "${toolkitLabel}". Provide the credential, then approve.`;
    const signInText = `Authorization is required for toolkit "${toolkitLabel}". Authorize now, then approve.`;
    const credentialRows = [
      ['Toolkit', toolkitLabel],
      ['Credential', waiting.credential],
      ['Status', status.label],
    ].filter(([, value]) => value);
    const step1Title = (
      <Box sx={styles.stepHeader}>
        ⚠️ Step 1: Toolkit Authorization Required
        <Chip
          data-testid="schedule-waiting-step1-status"
          size="small"
          variant="outlined"
          label={status.label}
          sx={styles.chip[status.tone]}
        />
      </Box>
    );
    const buttonProps = useActionButtonProps();
    const approval = (
      <ScheduleRunApproval
        compact
        plain={!isCredential && !isSignIn}
        schedule={schedule}
        run={shownRun}
        runId={shownRun.id}
        hasChat={shownRun.conversation_id != null}
        conversationUuid={conversation.conversationUuid}
        pausedMessageId={conversation.pausedMessageId}
        authAction={authAction}
        pausedAt={pausedEvent?.at}
        interruptIds={pausedEvent?.interrupt_ids}
        requireInterruptIds={
          !isCredential &&
          !isSignIn &&
          shownRun.conversation_id != null &&
          hasSeveralPendingTools(pausedEvent)
        }
        blockedReason={
          isCredential && credentialState !== CREDENTIAL_CHECK_STATE.READY ? BLOCKED_REASON : undefined
        }
      />
    );

    // A plain pause needs no steps: one short notice and the two decision buttons
    if (!isCredential && !isSignIn)
      return (
        <Box
          ref={ref}
          data-testid="schedule-waiting-card"
          component="section"
          aria-label="Action needed: this run is waiting for you"
          sx={styles.plain}
        >
          <Box
            role="status"
            sx={styles.notice}
          >
            <WarningAmberOutlinedIcon sx={styles.noticeIcon} />
            <Typography
              variant="bodySmall"
              sx={styles.noticeText}
            >
              {`This run will not start until you approve it. ${description} ${STEP2_NOTE}`}
            </Typography>
          </Box>
          <ScheduleWaitingTools pausedEvent={pausedEvent} />
          {expiry && (
            <Typography
              data-testid="schedule-waiting-expiry"
              variant="bodySmall"
              color="text.primary"
            >
              {expiry}
            </Typography>
          )}
          {approval}
        </Box>
      );

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
          {onShowTest && (
            <BaseBtn
              variant="elitea"
              color="secondary"
              onClick={onShowTest}
            >
              Show runs
            </BaseBtn>
          )}
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
              titleSx={styles.panelTitle}
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
            titleSx={styles.panelTitle}
          >
            {approval}
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
    border: `0.0625rem solid ${palette.warning.scheduleCard}`,
    backgroundColor: palette.background.default.tertiary,
    scrollMarginTop: '4.5rem',
  }),
  // Dark theme keeps the approved chat surface; light theme uses the lighter one, as the card is grey already
  panel: ({ palette }) => ({
    borderColor: palette.warning.scheduleCard,
    ...(palette.mode === 'light' && { background: palette.background.surface.interactive.default }),
  }),
  panelTitle: ({ palette }) => ({ color: palette.warning.scheduleCard }),
  button: { width: 'auto !important' },
  plain: { display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0 1.25rem 1.25rem' },
  notice: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.625rem 0.75rem',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.warning.scheduleCard}`,
    backgroundColor: palette.background.default.tertiary,
  }),
  noticeIcon: ({ palette }) => ({ fontSize: '1.25rem', flexShrink: 0, color: palette.warning.scheduleCard }),
  noticeText: ({ palette }) => ({ color: palette.text.secondary, minWidth: 0, overflowWrap: 'anywhere' }),
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
