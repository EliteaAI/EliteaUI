import { memo } from 'react';

import { Box } from '@mui/material';

import { BUTTON_VARIANTS, BaseBtn } from '@/[fsd]/shared/ui/button';
import { SingleSelect } from '@/[fsd]/shared/ui/select';

const FILTERS = [
  { key: 'schedule', label: 'Schedule' },
  { key: 'status', label: 'Status' },
  { key: 'trigger', label: 'Trigger type' },
  { key: 'version', label: 'Version' },
];

const RunHistoryFilters = memo(props => {
  const { values, options, handlers, hasFilters, onClear, hasScheduleFilter } = props;
  const styles = runHistoryFiltersStyles();

  return (
    <Box
      sx={styles.bar}
      data-testid="run-history-filters"
    >
      {FILTERS.filter(({ key }) => key !== 'schedule' || hasScheduleFilter).map(({ key, label }) => (
        <Box
          key={key}
          sx={styles.select}
          data-testid={`run-history-filter-${key}`}
        >
          <SingleSelect
            showBorder
            label={label}
            options={options[key]}
            value={values[key]}
            onValueChange={handlers[key]}
            // The empty value is "All": show its label instead of a blank select
            displayEmpty
            shrinkLabel
            showEmptyPlaceholder={false}
            inputProps={{ 'aria-label': label }}
          />
        </Box>
      ))}
      {hasFilters && (
        <BaseBtn
          variant={BUTTON_VARIANTS.text}
          onClick={onClear}
          data-testid="run-history-filters-clear"
        >
          Clear filters
        </BaseBtn>
      )}
    </Box>
  );
});

RunHistoryFilters.displayName = 'RunHistoryFilters';

/** @type {MuiSx} */
const runHistoryFiltersStyles = () => ({
  bar: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '0.75rem',
  },
  select: {
    width: '12rem',
  },
});

export default RunHistoryFilters;
