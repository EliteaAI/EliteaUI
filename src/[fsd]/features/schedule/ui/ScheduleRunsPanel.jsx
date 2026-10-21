import { memo, useMemo, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { Tab } from '@/[fsd]/shared/ui';

import { findNewestTestRun } from '../lib/helpers';
import { useScheduleRuns } from '../lib/hooks/useScheduleRuns.hooks';
import ScheduleRunList from './ScheduleRunList';
import ScheduleTestRun from './ScheduleTestRun';

const TEST_TAB = { value: 'test', label: 'Test schedule' };
const RUNS_TAB = { value: 'runs', label: 'Runs' };

/**
 * The Test schedule and Runs card of the Edit schedule page (owner CR 2026-10-21).
 * `onTestRun`, `testRunPending` and `testRunError` come from ScheduleForm's `sidePanel`.
 */
const ScheduleRunsPanel = memo(props => {
  const { schedule, onTestRun, testRunPending, testRunError } = props;

  const canRun = !!schedule.allowed_actions?.includes('run');
  const tabs = useMemo(() => (canRun ? [TEST_TAB, RUNS_TAB] : [RUNS_TAB]), [canRun]);
  const [selectedTab, setSelectedTab] = useState(tabs[0].value);
  // A lost run action hides the Test schedule tab, so the card falls back to Runs (R3.3)
  const tab = canRun ? selectedTab : RUNS_TAB.value;

  const runs = useScheduleRuns(schedule.id);
  const newestTestRun = useMemo(() => findNewestTestRun(runs), [runs]);

  const styles = scheduleRunsPanelStyles();

  return (
    <Box
      data-testid="schedule-runs-panel"
      sx={styles.root}
    >
      <Box sx={styles.tabs}>
        <Tab.TabGroupButton
          data-testid="schedule-runs-panel-tabs"
          arrayBtn={tabs}
          value={tab}
          onChange={(_, value) => setSelectedTab(value)}
          disableTooltip
        />
      </Box>
      {tab === TEST_TAB.value ? (
        <ScheduleTestRun
          run={newestTestRun}
          onTestRun={onTestRun}
          testRunPending={testRunPending}
          testRunError={testRunError}
        />
      ) : (
        <ScheduleRunList
          runs={runs}
          schedule={schedule}
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
});

ScheduleRunsPanel.displayName = 'ScheduleRunsPanel';

/** @type {MuiSx} */
const scheduleRunsPanelStyles = () => ({
  root: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    padding: '1rem 1.5rem 1.5rem',
    borderRadius: '1rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    backgroundColor: palette.background.default.tertiary,
  }),
  tabs: { display: 'flex', justifyContent: 'center' },
});

export default ScheduleRunsPanel;
