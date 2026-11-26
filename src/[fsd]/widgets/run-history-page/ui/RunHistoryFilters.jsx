import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { Select } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS, BaseBtn } from '@/[fsd]/shared/ui/button';

import { ALL_OPTION_VALUE } from '../lib/constants/runHistoryFilters.constants';
import StatusOptionLabel from './StatusOptionLabel';

// Only the Version filter gets a Search field, and only past this many versions (ticket AC-9)
const VERSION_SEARCH_THRESHOLD = 10;
const SEARCH_THRESHOLD_BY_FILTER = { version: VERSION_SEARCH_THRESHOLD };

// The label of each filter key, as the run history prototype names it
const FILTER_LABELS = {
  event: 'Event',
  schedule: 'Schedule/Webhook',
  index: 'Index',
  status: 'Status',
  complexity: 'Complexity',
  version: 'Version',
};

// The row that clears a filter (ticket AC-5, AC-6): the empty value, which the URL never carries
const ALL_ROW = { label: 'All', value: ALL_OPTION_VALUE };

// The filter's button text: All, the one ticked option, or how many are ticked (ticket AC-6)
const summaryOf = (values, options) => {
  if (!values.length) return 'All';
  if (values.length === 1) return options.find(option => option.value === values[0])?.label ?? values[0];

  return `${values.length} selected`;
};

const RunHistoryFilters = memo(props => {
  const { filterKeys, values, options, handlers, hasFilters, onClear, keepEmptyKeys = [] } = props;
  const styles = runHistoryFiltersStyles();

  // The entity's layout decides which filters exist. A filter with no option is not drawn, unless the caller keeps
  // it: an MCP's Event filter lists its tools, which are empty until its runs load.
  const visible = filterKeys.filter(
    key => FILTER_LABELS[key] && (keepEmptyKeys.includes(key) || (options[key] ?? []).length > 0),
  );

  return (
    <Box
      sx={styles.bar}
      data-testid="run-history-filters"
    >
      {visible.map(key => {
        const label = FILTER_LABELS[key];
        const selected = values[key] ?? [];
        const filterOptions = options[key] ?? [];
        const searchable = filterOptions.length > (SEARCH_THRESHOLD_BY_FILTER[key] ?? Infinity);

        return (
          <Box
            key={key}
            data-testid={`run-history-filter-${key}`}
          >
            <Select.SingleSelect
              separateLabel
              multiple
              showBorder
              // With no tick the select still shows its value ("All"), as the original filter did
              displayEmpty
              showEmptyPlaceholder={false}
              label={`${label}: `}
              options={[ALL_ROW, ...filterOptions].map(option => ({
                ...option,
                testId: `run-history-filter-${key}-option-${option.value || 'all'}-checkbox`,
              }))}
              // A status option shows its colour dot before the label, as the design does
              customRenderOption={option => (
                <StatusOptionLabel
                  label={option.label}
                  color={option.color}
                />
              )}
              value={selected}
              // Ticking All clears the other ticks (ticket AC-6): an All choice sends the empty list
              onValueChange={next => {
                // A tick on All clears the others; a tick on an option keeps the rest of the ticks
                const ticked =
                  next.includes(ALL_OPTION_VALUE) && !selected.includes(ALL_OPTION_VALUE) ? [] : next;
                handlers[key](ticked.filter(item => item !== ALL_OPTION_VALUE));
              }}
              // The button shows All, the one ticked option, or "N selected", not a row of chips
              customRenderValue={() => (
                <Typography
                  variant="bodyMedium"
                  data-testid={`run-history-filter-${key}-button`}
                >
                  {summaryOf(selected, filterOptions)}
                </Typography>
              )}
              withSearch={searchable}
              searchPlaceholder="Search"
              data-testid={`run-history-filter-${key}-select`}
            />
          </Box>
        );
      })}
      {hasFilters && (
        <BaseBtn
          variant={BUTTON_VARIANTS.text}
          onClick={onClear}
          data-testid="run-history-clear-filters-button"
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
});

export default RunHistoryFilters;
