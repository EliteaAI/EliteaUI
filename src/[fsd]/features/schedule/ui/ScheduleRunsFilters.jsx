import { memo, useMemo } from 'react';

import { Box } from '@mui/material';

import { SingleSelect } from '@/[fsd]/shared/ui/select';

import { TRIGGER_LABELS, toRunStatusMeta } from '../lib/helpers';

const ALL = 'all';

// One select per column of the card: the labels are inline ("Type: All"), as the Runs card of the mockup shows
const ScheduleRunsFilters = memo(props => {
  const { runs, trigger, status, onTriggerChange, onStatusChange } = props;

  const styles = scheduleRunsFiltersStyles();

  const triggerOptions = useMemo(
    () => [
      { value: ALL, label: 'All' },
      ...Object.entries(TRIGGER_LABELS)
        .filter(([value]) => runs.some(run => run.trigger === value))
        .map(([value, label]) => ({ value, label })),
    ],
    [runs],
  );
  const statusOptions = useMemo(
    () => [
      { value: ALL, label: 'All' },
      ...[...new Set(runs.map(run => run.status))].map(value => ({
        value,
        label: toRunStatusMeta(value).label,
      })),
    ],
    [runs],
  );

  return (
    <Box sx={styles.root}>
      <SingleSelect
        data-testid="schedule-runs-filter-trigger"
        label="Type:"
        separateLabel
        showEmptyPlaceholder={false}
        value={trigger}
        options={triggerOptions}
        onValueChange={onTriggerChange}
      />
      <SingleSelect
        data-testid="schedule-runs-filter-status"
        label="Status:"
        separateLabel
        showEmptyPlaceholder={false}
        value={status}
        options={statusOptions}
        onValueChange={onStatusChange}
      />
    </Box>
  );
});

ScheduleRunsFilters.displayName = 'ScheduleRunsFilters';

/** @type {MuiSx} */
const scheduleRunsFiltersStyles = () => ({
  root: { display: 'flex', gap: '1.5rem', padding: '0 1.5rem' },
});

export { ALL as ALL_RUNS };
export default ScheduleRunsFilters;
