import { forwardRef, memo, useMemo } from 'react';

import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Box, Link, Tooltip, Typography } from '@mui/material';

import { formatRunTimestamp } from '@/[fsd]/entities/run-history';
import { BannerMessage } from '@/[fsd]/shared/ui/banner-message';
import { BUTTON_VARIANTS, BaseBtn, ViewRunHistoryButton } from '@/[fsd]/shared/ui/button';

import { findNewestTestRun, isRunActive } from '../lib/helpers';
import { useScheduleRun, useScheduleRunConversation } from '../lib/hooks/useScheduleRuns.hooks';
import SchedulePromptSummary from './SchedulePromptSummary';
import ScheduleRunApproval from './ScheduleRunApproval';
import ScheduleRunLog from './ScheduleRunLog';
import ScheduleRunResult from './ScheduleRunResult';
import ScheduleRunStatusChip from './ScheduleRunStatusChip';

const INFO_TEXT =
  "A test run uses the same account, tools and risk check as a scheduled run. It shows the log here and is marked as 'test'.";
const NOTE_TEXT = 'A test never changes Last run or Next run.';
const VIEWED_RUN_FORMAT = 'd MMM HH:mm';
const NO_EVENTS = [];

/**
 * The Test schedule panel of the Edit schedule page: the live log
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

    // Without the run action the panel shows the log and the result only
    const showTestTools = !viewedRun && !!schedule.allowed_actions?.includes('run');
    // The info box shows before the first test run only; after it the "i" button holds it
    const showInfoBox = showTestTools && !newestTestRun;
    const showInfoButton = showTestTools && !!newestTestRun;
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
          {showInfoButton && (
            <Tooltip
              describeChild
              title={
                <Box sx={styles.tooltip}>
                  <Typography variant="bodySmall">{INFO_TEXT}</Typography>
                  <Typography variant="bodySmall">{NOTE_TEXT}</Typography>
                </Box>
              }
            >
              <BaseBtn
                variant={BUTTON_VARIANTS.tertiary}
                startIcon={<InfoOutlinedIcon />}
                aria-label="About test runs"
                sx={styles.infoButton}
              />
            </Tooltip>
          )}
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
        <Box
          data-testid="schedule-runs-panel-body"
          sx={styles.body}
        >
          {showInfoBox && (
            <BannerMessage variant="info">
              <Typography variant="bodySmall">{INFO_TEXT}</Typography>
              <Typography variant="bodySmall">{NOTE_TEXT}</Typography>
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
        </Box>
        <Box
          data-testid="schedule-runs-panel-footer"
          sx={styles.footer}
        >
          {showTestTools && (
            <SchedulePromptSummary
              prompt={schedule.prompt}
              variables={schedule.variables}
              versionLabel={versionNames[schedule.version_id]}
              running={active}
              pending={testRunPending}
              description={NOTE_TEXT}
              onTestRun={onTestRun}
            />
          )}
        </Box>
      </Box>
    );
  }),
);

ScheduleRunsPanel.displayName = 'ScheduleRunsPanel';

/** @type {MuiSx} */
const scheduleRunsPanelStyles = () => ({
  // In the sticky block (xl, a tall window) the card takes the free height and its body scrolls
  // 1 rem on top and no bottom padding, because the pinned prompt line has its own
  root: ({ palette, breakpoints }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '1rem 1.5rem 0',
    borderRadius: '1rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    backgroundColor: palette.background.default.tertiary,
    scrollMarginTop: '4.5rem',
    [`${breakpoints.up('xl')} and (min-height: 46rem)`]: { flex: '1 1 0', minHeight: '20rem' },
  }),
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    flex: '1 1 auto',
    minHeight: 0,
    overflowY: 'auto',
    paddingBottom: '0.75rem',
  },
  // One pinned line of 61 px: a 1 px top border and 0.75 rem above and below the 36 px row
  footer: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    padding: '0.75rem 0',
    borderTop: `0.0625rem solid ${palette.border.lines}`,
    '&:empty': { display: 'none' },
  }),
  header: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', minHeight: '2.25rem' },
  title: ({ palette }) => ({ fontSize: '1.125rem', fontWeight: 600, color: palette.text.primary }),
  headerAction: { marginLeft: 'auto' },
  // The tertiary button paints its icon with --btn-icon-fill; the spec asks for the info blue, also on hover
  infoButton: ({ palette }) => ({
    minWidth: '2.75rem',
    minHeight: '2.75rem',
    margin: '-0.25rem',
    '--btn-icon-fill': palette.icon.info,
    '&:hover': { '--btn-icon-fill': palette.icon.info },
  }),
  tooltip: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  logHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '-0.5rem',
  },
});

export default ScheduleRunsPanel;
