import { memo } from 'react';

import { Box } from '@mui/material';

import { BUTTON_VARIANTS, BaseBtn } from '@/[fsd]/shared/ui/button';
import { SingleSelect } from '@/[fsd]/shared/ui/select';

// The order and the inline "Label: All" form of the Run History mockup
const FILTERS = [
  { key: 'trigger', label: 'Trigger type' },
  { key: 'status', label: 'Status' },
  { key: 'version', label: 'Version' },
  { key: 'schedule', label: 'Schedule' },
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
            separateLabel
            label={label}
            labelSX={styles.label}
            options={options[key]}
            value={values[key]}
            onValueChange={handlers[key]}
            // The empty value is "All": show its label instead of a blank select
            displayEmpty
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
    gap: '2rem',
    padding: '0 0.5rem',
  },
  // Each filter is as wide as its text, so the bar reads as one line
  select: { minWidth: 0 },
  // the inline "Label: All" form
  label: { '&::after': { content: '":"' } },
});

export default RunHistoryFilters;
