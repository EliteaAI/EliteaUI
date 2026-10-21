import { forwardRef, memo, useMemo } from 'react';

import { Box, Link, Typography } from '@mui/material';

import { formatRunTimestamp } from '@/[fsd]/entities/run-history/lib/helpers';
import BannerMessage from '@/[fsd]/shared/ui/banner-message/BannerMessage';
import ViewRunHistoryButton from '@/[fsd]/shared/ui/button/ViewRunHistoryButton';

import { findNewestTestRun, isRunActive } from '../lib/helpers';
import { useScheduleRun, useScheduleRunConversation } from '../lib/hooks/useScheduleRuns.hooks';
import SchedulePromptSummary from './SchedulePromptSummary';
import ScheduleRunApproval from './ScheduleRunApproval';
import ScheduleRunLog from './ScheduleRunLog';
import ScheduleRunResult from './ScheduleRunResult';
import ScheduleRunStatusChip from './ScheduleRunStatusChip';

const INFO_TEXT =
  "A test run uses the same account, tools and risk check as a scheduled run. It shows the log here and is marked as 'test'.";
const VIEWED_RUN_FORMAT = 'd MMM HH:mm';
const NO_EVENTS = [];

/**
 * The Test schedule panel of the Edit schedule page (owner CR 2026-10-21 test panel log): the live log
 * of the newest test run, or of `viewedRun` opened from the Runs section. `onTestRun`, `testRunPending`
 * and `testRunError` come from ScheduleForm's `sidePanel`.
 */
const ScheduleRunsPanel = memo(
  forwardRef((props, ref) => {
    const {
      schedule,
      runs,
      viewedRun,
      versionNames = {},
      onRunHistory,
      onBackToTest,
      onTestRun,
      testRunPending,
      testRunError,
    } = props;

    const newestTestRun = useMemo(() => findNewestTestRun(runs), [runs]);
    const row = viewedRun ?? newestTestRun;
    const { run: detail, isError, refetch } = useScheduleRun(schedule.id, row?.id);
    const run = detail ?? row;
    const conversation = useScheduleRunConversation(run);

    // R3.3: without the run action the panel shows the log and the result only
    const showTestTools = !viewedRun && !!schedule.allowed_actions?.includes('run');
    // A starting test hides the previous test, which is still the newest until the list loads again
    const starting = !viewedRun && testRunPending;
    const shownRun = starting ? undefined : run;
    const events = (!starting && detail?.events) || NO_EVENTS;
    const active = isRunActive(shownRun?.status);
    let emptyText = 'No log lines yet.';
    if (starting) emptyText = 'Starting test run...';
    else if (!run) emptyText = 'No test runs yet.';

    const styles = scheduleRunsPanelStyles();

    return (
      <Box
        ref={ref}
        data-testid="schedule-runs-panel"
        sx={styles.root}
      >
        <Box sx={styles.header}>
          <Typography
            component="h2"
            sx={styles.title}
          >
            {viewedRun
              ? `Run ${formatRunTimestamp(viewedRun.started_at, VIEWED_RUN_FORMAT)} · ${viewedRun.trigger}`
              : 'Test schedule'}
          </Typography>
          {viewedRun && (
            <Link
              component="button"
              type="button"
              variant="bodyMedium"
              onClick={onBackToTest}
            >
              Back to test
            </Link>
          )}
          <Box sx={styles.headerAction}>
            <ViewRunHistoryButton
              testId="schedule-run-history"
              tooltip="Show the runs of this schedule"
              onShowHistory={onRunHistory}
            />
          </Box>
        </Box>
        {showTestTools && (
          <BannerMessage variant="info">
            <Typography variant="bodySmall">{INFO_TEXT}</Typography>
          </BannerMessage>
        )}
        {testRunError && (
          <BannerMessage
            variant="error"
            message={testRunError}
          />
        )}
        {isError && (
          <BannerMessage variant="error">
            <Typography variant="bodySmall">
              Failed to load the run log.{' '}
              <Link
                component="button"
                type="button"
                variant="bodySmall"
                onClick={refetch}
              >
                Retry
              </Link>
            </Typography>
          </BannerMessage>
        )}
        <Box sx={styles.logHeader}>
          <Typography
            variant="labelSmall"
            color="text.secondary"
          >
            LIVE LOG
          </Typography>
          {shownRun && (
            <Box data-testid="schedule-run-log-status">
              <ScheduleRunStatusChip status={shownRun.status} />
            </Box>
          )}
        </Box>
        <ScheduleRunLog
          key={shownRun?.id}
          events={events}
          emptyText={emptyText}
          pausedAction={
            shownRun?.status === 'waiting_for_approval' && (
              <ScheduleRunApproval
                schedule={schedule}
                conversationUuid={conversation.conversationUuid}
                pausedMessageId={conversation.pausedMessageId}
                pausedAt={events.findLast(event => event.kind === 'paused')?.at}
              />
            )
          }
        />
        {shownRun && !active && (
          <ScheduleRunResult
            run={shownRun}
            answer={conversation.answer}
          />
        )}
        {showTestTools && (
          <SchedulePromptSummary
            prompt={schedule.prompt}
            variables={schedule.variables}
            versionLabel={versionNames[schedule.version_id]}
            running={active}
            pending={testRunPending}
            onTestRun={onTestRun}
          />
        )}
        <Typography
          variant="bodySmall"
          color="text.secondary"
        >
          A test never changes Last run or Next run.
        </Typography>
      </Box>
    );
  }),
);

ScheduleRunsPanel.displayName = 'ScheduleRunsPanel';

/** @type {MuiSx} */
const scheduleRunsPanelStyles = () => ({
  root: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    padding: '1.5rem',
    borderRadius: '1rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    backgroundColor: palette.background.default.tertiary,
    scrollMarginTop: '1rem',
  }),
  header: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' },
  title: ({ palette }) => ({ fontSize: '1.125rem', fontWeight: 600, color: palette.text.primary }),
  headerAction: { marginLeft: 'auto' },
  logHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '-0.5rem',
  },
});

export default ScheduleRunsPanel;
