import { memo, useCallback, useMemo } from 'react';

import { Box } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { SKILL_RUN_STATUS_LABELS } from '@/[fsd]/features/skill/lib/constants';
import { hasSkillRunHistoryFilters } from '@/[fsd]/features/skill/lib/helpers';
import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { SimpleSearchBar } from '@/[fsd]/shared/ui/input';
import CalendarIcon from '@/components/Icons/CalendarIcon';

import SkillRunHistoryFilterSelect from './SkillRunHistoryFilterSelect';

const STATUS_OPTIONS = Object.entries(SKILL_RUN_STATUS_LABELS).map(([value, label]) => ({ value, label }));
const DATE_PICKER_SLOTS = { openPickerIcon: CalendarIcon };
const NO_FACETS = { authors: [], models: [] };

const datePickerSlotProps = (testId, placeholder) => ({
  textField: {
    size: 'small',
    variant: 'standard',
    placeholder,
    inputProps: { 'data-testid': testId, placeholder },
  },
  actionBar: { actions: ['clear', 'accept'] },
});

const SkillRunHistoryFilters = memo(props => {
  const { filters, onChange, onClear, facets, versions } = props;
  const styles = skillRunHistoryFiltersStyles();
  const { authors, models } = facets ?? NO_FACETS;

  const userOptions = useMemo(
    () =>
      (authors ?? []).map(author => ({
        value: author.id,
        label: author.name || author.email || `#${author.id}`,
      })),
    [authors],
  );
  const modelOptions = useMemo(() => (models ?? []).map(model => ({ value: model, label: model })), [models]);
  const versionOptions = useMemo(
    () => (versions ?? []).map(version => ({ value: version.id, label: version.name })),
    [versions],
  );

  const setFilter = useCallback(key => value => onChange({ [key]: value }), [onChange]);
  const onSearchChange = useCallback(query => onChange({ query }), [onChange]);
  const onSearchClear = useCallback(() => onChange({ query: '' }), [onChange]);

  return (
    <Box
      sx={styles.bar}
      data-testid="skill-run-history-filters"
    >
      <SimpleSearchBar
        searchQuery={filters.query ?? ''}
        onSearchChange={onSearchChange}
        onSearchClear={onSearchClear}
        placeholder="Search runs"
        autoFocus={false}
        sx={styles.search}
        data-testid="skill-run-history-search"
      />
      <Box sx={styles.date}>
        <DatePicker
          value={filters.dateFrom ?? null}
          onChange={setFilter('dateFrom')}
          maxDate={filters.dateTo ?? undefined}
          slots={DATE_PICKER_SLOTS}
          slotProps={datePickerSlotProps('skill-run-history-date-from', 'From')}
        />
      </Box>
      <Box sx={styles.date}>
        <DatePicker
          value={filters.dateTo ?? null}
          onChange={setFilter('dateTo')}
          minDate={filters.dateFrom ?? undefined}
          slots={DATE_PICKER_SLOTS}
          slotProps={datePickerSlotProps('skill-run-history-date-to', 'To')}
        />
      </Box>
      <SkillRunHistoryFilterSelect
        testId="skill-run-history-user-filter"
        label="User"
        value={filters.authorId}
        options={userOptions}
        onChange={setFilter('authorId')}
      />
      <SkillRunHistoryFilterSelect
        testId="skill-run-history-model-filter"
        label="Model"
        value={filters.model}
        options={modelOptions}
        onChange={setFilter('model')}
      />
      <SkillRunHistoryFilterSelect
        testId="skill-run-history-status-filter"
        label="Status"
        value={filters.status}
        options={STATUS_OPTIONS}
        onChange={setFilter('status')}
      />
      <SkillRunHistoryFilterSelect
        testId="skill-run-history-version-filter"
        label="Version"
        value={filters.versionId}
        options={versionOptions}
        onChange={setFilter('versionId')}
      />
      {hasSkillRunHistoryFilters(filters) && (
        <BaseBtn
          variant={BUTTON_VARIANTS.text}
          onClick={onClear}
          data-testid="skill-run-history-clear-filters"
        >
          Clear filters
        </BaseBtn>
      )}
    </Box>
  );
});

SkillRunHistoryFilters.displayName = 'SkillRunHistoryFilters';

/** @type {MuiSx} */
const skillRunHistoryFiltersStyles = () => ({
  bar: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    gap: '0.75rem',
  },
  search: {
    width: '14rem',
  },
  date: {
    width: '9rem',
  },
});

export default SkillRunHistoryFilters;
