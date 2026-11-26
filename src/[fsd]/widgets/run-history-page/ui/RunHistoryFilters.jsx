import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { Select } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS, BaseBtn } from '@/[fsd]/shared/ui/button';

import { ALL_OPTION_VALUE } from '../lib/constants/runHistoryFilters.constants';
import StatusOptionLabel from './StatusOptionLabel';

const VERSION_SEARCH_THRESHOLD = 10;
const SEARCH_THRESHOLD_BY_FILTER = { version: VERSION_SEARCH_THRESHOLD };

const FILTER_LABELS = {
  event: 'Event',
  schedule: 'Schedule/Webhook',
  index: 'Index',
  status: 'Status',
  complexity: 'Complexity',
  version: 'Version',
};

const ALL_ROW = { label: 'All', value: ALL_OPTION_VALUE };

const summaryOf = (values, options) => {
  if (!values.length) return 'All';
  if (values.length === 1) return options.find(option => option.value === values[0])?.label ?? values[0];

  return `${values.length} selected`;
};

const RunHistoryFilters = memo(props => {
  const { filterKeys, values, options, handlers, hasFilters, onClear, keepEmptyKeys = [] } = props;
  const styles = runHistoryFiltersStyles();

  // A filter with no options is hidden unless the caller keeps it
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
              displayEmpty
              showEmptyPlaceholder={false}
              label={`${label}: `}
              options={[ALL_ROW, ...filterOptions].map(option => ({
                ...option,
                testId: `run-history-filter-${key}-option-${option.value || 'all'}-checkbox`,
              }))}
              customRenderOption={option => (
                <StatusOptionLabel
                  label={option.label}
                  color={option.color}
                />
              )}
              value={selected}
              onValueChange={next => {
                // Ticking All clears the other ticks
                const ticked =
                  next.includes(ALL_OPTION_VALUE) && !selected.includes(ALL_OPTION_VALUE) ? [] : next;
                handlers[key](ticked.filter(item => item !== ALL_OPTION_VALUE));
              }}
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
