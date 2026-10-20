import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Box, debounce } from '@mui/material';

import { BaseBtn } from '@/[fsd]/shared/ui/button';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { SimpleSearchBar } from '@/[fsd]/shared/ui/input';
import { SingleSelect } from '@/[fsd]/shared/ui/select';

import OwnerFilter from './OwnerFilter';

const SEARCH_DELAY_MS = 300;

const ALL = { label: 'All', value: '' };
const TYPE_OPTIONS = [ALL, { label: 'Agent', value: 'agent' }, { label: 'Pipeline', value: 'pipeline' }];
const STATUS_OPTIONS = [
  ALL,
  { label: 'Running', value: 'running' },
  { label: 'Success', value: 'success' },
  { label: 'Failed', value: 'failed' },
  { label: 'Skipped', value: 'skipped' },
  { label: 'Blocked', value: 'blocked' },
  { label: 'Waiting for approval', value: 'waiting_for_approval' },
];
// The select keeps string values; the list API takes a boolean
const ENABLED_OPTIONS = [ALL, { label: 'Yes', value: 'true' }, { label: 'No', value: 'false' }];

// An unset select shows its label as the placeholder; a set select shows the label above the value
const FilterSelect = memo(({ id, label, width, options, value, onValueChange }) => {
  const styles = schedulesFiltersStyles();
  return (
    <Box
      sx={[styles.select, { width }]}
      data-testid={`schedules-filter-${id}`}
    >
      <SingleSelect
        showBorder
        label={label}
        options={options}
        value={value}
        onValueChange={onValueChange}
        showEmptyPlaceholder={false}
        inputProps={{ 'aria-label': label }}
      />
    </Box>
  );
});
FilterSelect.displayName = 'FilterSelect';

const SchedulesFilters = memo(({ value, onChange, onClear, hasFilters, isAdmin }) => {
  const styles = schedulesFiltersStyles();
  const [searchText, setSearchText] = useState(value.search);
  // The value only carries ids; the Owner filter needs the user objects for its chips
  const [owners, setOwners] = useState([]);
  const searchInputRef = useRef(null);

  // The debounced call reads the latest props, so a filter picked while typing is not lost
  const latest = useRef({ value, onChange });
  useEffect(() => {
    latest.current = { value, onChange };
  });
  const emitSearch = useMemo(
    () => debounce(search => latest.current.onChange({ ...latest.current.value, search }), SEARCH_DELAY_MS),
    [],
  );
  useEffect(() => () => emitSearch.clear(), [emitSearch]);

  const handleSearchChange = useCallback(
    text => {
      setSearchText(text);
      emitSearch(text);
    },
    [emitSearch],
  );
  const handleSearchClear = useCallback(() => handleSearchChange(''), [handleSearchChange]);

  const handleEntityType = useCallback(entityType => onChange({ ...value, entityType }), [onChange, value]);
  const handleStatus = useCallback(status => onChange({ ...value, status }), [onChange, value]);
  const handleEnabled = useCallback(
    enabled => onChange({ ...value, enabled: enabled === '' ? '' : enabled === 'true' }),
    [onChange, value],
  );
  const handleOwners = useCallback(
    picked => {
      setOwners(picked);
      onChange({ ...value, ownerIds: picked.map(owner => owner.id) });
    },
    [onChange, value],
  );

  // The search text and the owner chips live here, so they are emptied here too
  const handleClear = useCallback(() => {
    emitSearch.clear();
    setSearchText('');
    setOwners([]);
    onClear();
    searchInputRef.current?.focus();
  }, [emitSearch, onClear]);

  return (
    <Box
      sx={styles.bar}
      role="group"
      aria-label="Schedule filters"
    >
      <Box sx={styles.search}>
        <SimpleSearchBar
          searchQuery={searchText}
          onSearchChange={handleSearchChange}
          onSearchClear={handleSearchClear}
          placeholder="Search"
          autoFocus={false}
          inputRef={searchInputRef}
          inputProps={{ 'aria-label': 'Search schedules' }}
        />
      </Box>
      <FilterSelect
        id="type"
        label="Type"
        width="9.5rem"
        options={TYPE_OPTIONS}
        value={value.entityType}
        onValueChange={handleEntityType}
      />
      <FilterSelect
        id="status"
        label="Status"
        width="10.5rem"
        options={STATUS_OPTIONS}
        value={value.status}
        onValueChange={handleStatus}
      />
      {isAdmin && (
        <Box
          sx={styles.owner}
          role="group"
          aria-label="Owner"
        >
          <OwnerFilter
            selectedOwners={owners}
            onChangeOwners={handleOwners}
          />
        </Box>
      )}
      <FilterSelect
        id="enabled"
        label="Enabled"
        width="8.5rem"
        options={ENABLED_OPTIONS}
        value={value.enabled === '' ? '' : String(value.enabled)}
        onValueChange={handleEnabled}
      />
      {hasFilters && (
        <BaseBtn
          variant={BUTTON_VARIANTS.text}
          onClick={handleClear}
          data-testid="schedules-filters-clear"
        >
          Clear filters
        </BaseBtn>
      )}
    </Box>
  );
});

SchedulesFilters.displayName = 'SchedulesFilters';

/** @type {MuiSx} */
const schedulesFiltersStyles = () => ({
  bar: { display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end', width: '100%' },
  // Below 1100 px the search takes its own row and the other controls share the next rows
  search: ({ breakpoints }) => ({
    width: '12.5rem',
    [breakpoints.down(1100)]: { flexBasis: '100%', width: 'auto' },
  }),
  select: ({ breakpoints }) => ({
    [breakpoints.down(1100)]: { flex: '1 1 9rem' },
    [breakpoints.down('sm')]: { flexBasis: '100%' },
  }),
  // The owner chips wrap inside the control, so the bar grows in height
  owner: ({ breakpoints }) => ({
    width: '15rem',
    [breakpoints.down(1100)]: { flex: '1 1 15rem', width: 'auto', minWidth: '15rem' },
    [breakpoints.down('sm')]: { flexBasis: '100%', minWidth: 0 },
  }),
});

export default SchedulesFilters;
