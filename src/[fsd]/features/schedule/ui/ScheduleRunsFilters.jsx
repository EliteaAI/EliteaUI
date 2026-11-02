import { memo } from 'react';

import { Box } from '@mui/material';

import { BUTTON_VARIANTS, BaseBtn } from '@/[fsd]/shared/ui/button';
import { SingleSelect } from '@/[fsd]/shared/ui/select';

import { TRIGGER_FILTER_OPTIONS } from '../lib/helpers';

// The Type and Status filters of the Runs card
const ScheduleRunsFilters = memo(props => {
  const { filters, statusOptions, onChange, onClear } = props;
  const styles = scheduleRunsFiltersStyles();
  const hasFilters = Boolean(filters.trigger || filters.status);

  return (
    <Box
      sx={styles.root}
      data-testid="schedule-runs-filters"
    >
      <Box sx={styles.select}>
        <SingleSelect
          showBorder
          label="Type"
          options={TRIGGER_FILTER_OPTIONS}
          value={filters.trigger}
          onValueChange={value => onChange('trigger', value)}
          displayEmpty
          shrinkLabel
          showEmptyPlaceholder={false}
          inputProps={{ 'aria-label': 'Type' }}
        />
      </Box>
      <Box sx={styles.select}>
        <SingleSelect
          showBorder
          label="Status"
          options={statusOptions}
          value={filters.status}
          onValueChange={value => onChange('status', value)}
          displayEmpty
          shrinkLabel
          showEmptyPlaceholder={false}
          inputProps={{ 'aria-label': 'Status' }}
        />
      </Box>
      {hasFilters && (
        <BaseBtn
          variant={BUTTON_VARIANTS.text}
          onClick={onClear}
          data-testid="schedule-runs-filters-clear"
        >
          Clear filters
        </BaseBtn>
      )}
    </Box>
  );
});

ScheduleRunsFilters.displayName = 'ScheduleRunsFilters';

/** @type {MuiSx} */
const scheduleRunsFiltersStyles = () => ({
  root: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' },
  select: { width: '9rem' },
});

export default ScheduleRunsFilters;
