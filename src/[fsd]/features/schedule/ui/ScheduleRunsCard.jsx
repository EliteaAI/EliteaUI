import { forwardRef, memo } from 'react';

import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import { Box, Typography } from '@mui/material';

import { BannerMessage } from '@/[fsd]/shared/ui/banner-message';
import { BUTTON_VARIANTS, BaseBtn } from '@/[fsd]/shared/ui/button';
import { PERMISSIONS } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';

import { isRunActive, ownerOnlyRunHint } from '../lib/helpers';
import ScheduleRunCard from './ScheduleRunCard';
import ScheduleRunsFilters from './ScheduleRunsFilters';

const RUN_NOW_NOTE = 'Run Now runs the saved schedule and is recorded as Manual. It never changes Next run.';
const TEST_RUN_NOTE =
  'Test Run runs the form as it is now, without saving it. It never changes Last run or Next run.';

/**
 * The "Runs (count)" card right of the schedule form. `view` is the result of `useScheduleRunsView`.
 * Run Now needs a saved schedule; Test Run is for a new, unsaved one and gives way to Run Now after Save. `schedule` is empty on the Create page.
 */
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
    const { runs, shownRuns, total, versionNames, expandedRunId, onExpand, filters, statusOptions } = view;
    const hasActiveRun = runs.some(run => isRunActive(run.status));
    const canRunNow = Boolean(schedule?.id) && Boolean(schedule?.allowed_actions?.includes('run'));
    const canTest = checkPermission(PERMISSIONS.schedules.run);
    const runHint = schedule?.id ? ownerOnlyRunHint(schedule) : null;
    const busy = hasActiveRun || runNowPending || testRunPending;
    const newestId = runs[0]?.id;
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
                variant={BUTTON_VARIANTS.elitea}
                color="secondary"
                startIcon={<PlayArrowIcon />}
                disabled={busy || !canRunNow || !!runHint}
                onClick={onRunNow}
              >
                Run Now
              </BaseBtn>
            )}
            {!schedule?.id && (
              <BaseBtn
                data-testid="schedule-test-run"
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
        <Typography
          variant="bodySmall"
          color="text.secondary"
          data-testid="schedule-runs-note"
        >
          {schedule?.id ? RUN_NOW_NOTE : TEST_RUN_NOTE}
        </Typography>
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
        {runs.length > 0 && (
          <ScheduleRunsFilters
            filters={filters}
            statusOptions={statusOptions}
            onChange={view.onFilterChange}
            onClear={view.onClearFilters}
          />
        )}
        {runs.length === 0 ? (
          <Typography
            variant="bodyMedium"
            color="text.secondary"
            sx={styles.empty}
          >
            No runs yet.
          </Typography>
        ) : shownRuns.length === 0 ? (
          <Typography
            variant="bodyMedium"
            color="text.secondary"
            sx={styles.empty}
          >
            No runs match the filters.
          </Typography>
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
  root: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '1rem 1.5rem',
    borderRadius: '1rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    backgroundColor: palette.background.default.tertiary,
    scrollMarginTop: '4.5rem',
    outline: 'none',
  }),
  header: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', minHeight: '2.25rem' },
  title: ({ palette }) => ({
    flex: '1 1 auto',
    fontSize: '1.125rem',
    fontWeight: 600,
    color: palette.text.primary,
  }),
  count: ({ palette }) => ({ color: palette.text.secondary, fontWeight: 400 }),
  actions: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
  list: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  empty: { padding: '1rem 0', textAlign: 'center' },
});

export default ScheduleRunsCard;
