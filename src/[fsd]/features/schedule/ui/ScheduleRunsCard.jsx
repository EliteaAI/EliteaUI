import { forwardRef, memo, useState } from 'react';

import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined';
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import { Box, Typography } from '@mui/material';

import { BannerMessage } from '@/[fsd]/shared/ui/banner-message';
import { BUTTON_VARIANTS, BaseBtn } from '@/[fsd]/shared/ui/button';
import { PERMISSIONS } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';

import { isRunActive, ownerOnlyRunHint } from '../lib/helpers';
import ScheduleRunCard from './ScheduleRunCard';
import ScheduleRunsFilters, { ALL_RUNS } from './ScheduleRunsFilters';

/**
 * The "Runs (count)" card right of the schedule form. `view` is the result of `useScheduleRunsView`.
 * Run Now needs a saved schedule; Test Run is for a new, unsaved one and gives way to Run Now after Save. `schedule` is empty on the Create page.
 */
const RUN_NOW_NOTE = 'Runs the saved schedule and records it as Manual. Next run does not change.';
const TEST_RUN_NOTE = 'Runs the form as it is now, without saving. Last run and Next run do not change.';

const ScheduleRunsCard = memo(
  forwardRef((props, ref) => {
    const {
      schedule,
      entityType,
      applicationId,
      view,
      onRunNow,
      runNowPending = false,
      runNowError,
      onTestRun,
      testRunPending = false,
      testRunError,
    } = props;

    const { checkPermission } = useCheckPermission();
    const { runs, total, versionNames, expandedRunId, onExpand } = view;
    const hasActiveRun = runs.some(run => isRunActive(run.status));
    const canRunNow = Boolean(schedule?.id) && Boolean(schedule?.allowed_actions?.includes('run'));
    const canTest = checkPermission(PERMISSIONS.schedules.run);
    const runHint = schedule?.id ? ownerOnlyRunHint(schedule) : null;
    const busy = hasActiveRun || runNowPending || testRunPending;
    const newestId = runs[0]?.id;
    const [trigger, setTrigger] = useState(ALL_RUNS);
    const [status, setStatus] = useState(ALL_RUNS);
    const shownRuns = runs.filter(
      run =>
        (trigger === ALL_RUNS || run.trigger === trigger) && (status === ALL_RUNS || run.status === status),
    );
    const styles = scheduleRunsCardStyles();

    return (
      <Box
        ref={ref}
        id="runs"
        role="region"
        aria-label="Runs"
        tabIndex={-1}
        data-testid="schedule-runs-card"
        sx={styles.root}
      >
        <Box sx={styles.header}>
          <Typography
            component="h2"
            sx={styles.title}
          >
            Runs
            {Number.isFinite(total) && (
              <Box
                component="span"
                data-testid="schedule-runs-count"
                sx={styles.count}
              >{` (${total})`}</Box>
            )}
          </Typography>
          <Box sx={styles.actions}>
            {schedule?.id && (
              <BaseBtn
                data-testid="schedule-run-now"
                title={RUN_NOW_NOTE}
                variant={BUTTON_VARIANTS.secondary}
                sx={styles.runNow}
                startIcon={<PlayArrowOutlinedIcon />}
                disabled={busy || !canRunNow || !!runHint}
                onClick={onRunNow}
              >
                Run Now
              </BaseBtn>
            )}
            {!schedule?.id && (
              <BaseBtn
                data-testid="schedule-test-run"
                title={TEST_RUN_NOTE}
                variant={BUTTON_VARIANTS.elitea}
                color="primary"
                startIcon={<ScienceOutlinedIcon />}
                disabled={busy || !canTest || !!runHint}
                onClick={onTestRun}
              >
                Test Run
              </BaseBtn>
            )}
          </Box>
        </Box>
        {runHint && (
          <Typography
            variant="bodySmall"
            color="text.secondary"
            data-testid="schedule-test-run-hint"
          >
            {runHint}
          </Typography>
        )}
        {(runNowError || testRunError) && (
          <BannerMessage
            variant="error"
            message={runNowError || testRunError}
          />
        )}
        {runs.length > 1 && (
          <ScheduleRunsFilters
            runs={runs}
            trigger={trigger}
            status={status}
            onTriggerChange={setTrigger}
            onStatusChange={setStatus}
          />
        )}
        {runs.length === 0 ? (
          <Box sx={styles.empty}>
            <PendingActionsOutlinedIcon sx={styles.emptyIcon} />
            <Typography
              variant="bodyMedium"
              color="text.secondary"
            >
              No runs yet
            </Typography>
          </Box>
        ) : (
          <Box
            component="ul"
            sx={styles.list}
          >
            {shownRuns.map(run => (
              <ScheduleRunCard
                key={`${run.isDraftRun ? 'draft' : 'saved'}-${run.id}`}
                run={run}
                isLatest={run.id === newestId}
                expanded={run.id === expandedRunId}
                versionNames={versionNames}
                schedule={schedule}
                entityType={entityType}
                applicationId={applicationId}
                onToggle={onExpand}
                onRunAgain={canRunNow && !busy ? onRunNow : undefined}
              />
            ))}
          </Box>
        )}
      </Box>
    );
  }),
);

ScheduleRunsCard.displayName = 'ScheduleRunsCard';

/** @type {MuiSx} */
const scheduleRunsCardStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.625rem',
    padding: '0 0 1.5rem',
    scrollMarginTop: '4.5rem',
    outline: 'none',
  },
  header: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    minHeight: '3.3125rem',
    padding: '0 1.5rem',
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
  }),
  title: ({ palette }) => ({
    flex: '1 1 auto',
    fontSize: '0.875rem',
    fontWeight: 600,
    color: palette.text.primary,
  }),
  count: ({ palette }) => ({ color: palette.text.secondary, fontWeight: 400 }),
  // The mockup draws Run Now as an outlined pill without a fill
  runNow: ({ palette }) => ({
    backgroundColor: 'transparent',
    border: `0.0625rem solid ${palette.border.lines}`,
  }),
  actions: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
  list: {
    listStyle: 'none',
    margin: 0,
    padding: '0 1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  empty: {
    padding: '2rem 0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
  },
  emptyIcon: ({ palette }) => ({ fontSize: '2.5rem', color: palette.icon.default }),
});

export default ScheduleRunsCard;
