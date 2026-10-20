import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Box, Typography, debounce, useTheme } from '@mui/material';

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

const FilterSelect = memo(({ id, label, options, value, onValueChange }) => {
  const theme = useTheme();
  const styles = schedulesFiltersStyles();
  return (
    <Box
      sx={styles.control}
      data-testid={`schedules-filter-${id}`}
    >
      <Box sx={styles.labelBox}>
        <Typography
          component="div"
          variant="bodyMedium"
          color="text.primary"
        >
          {label}:
        </Typography>
      </Box>
      <Box sx={styles.selectBox}>
        <SingleSelect
          onValueChange={onValueChange}
          value={value}
          options={options}
          customSelectedColor={`${theme.palette.text.primary} !important`}
          customSelectedFontSize="0.875rem"
          sx={styles.select}
        />
      </Box>
    </Box>
  );
});
FilterSelect.displayName = 'FilterSelect';

const SchedulesFilters = memo(({ value, onChange, isAdmin }) => {
  const styles = schedulesFiltersStyles();
  const [searchText, setSearchText] = useState(value.search);
  // The value only carries ids; the Owner filter needs the user objects for its chips
  const [owners, setOwners] = useState([]);

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

  return (
    <Box sx={styles.bar}>
      <Box sx={styles.search}>
        <SimpleSearchBar
          searchQuery={searchText}
          onSearchChange={handleSearchChange}
          placeholder="Search"
          autoFocus={false}
        />
      </Box>
      <FilterSelect
        id="type"
        label="Type"
        options={TYPE_OPTIONS}
        value={value.entityType}
        onValueChange={handleEntityType}
      />
      <FilterSelect
        id="status"
        label="Status"
        options={STATUS_OPTIONS}
        value={value.status}
        onValueChange={handleStatus}
      />
      <FilterSelect
        id="enabled"
        label="Enabled"
        options={ENABLED_OPTIONS}
        value={value.enabled === '' ? '' : String(value.enabled)}
        onValueChange={handleEnabled}
      />
      {isAdmin && (
        <Box sx={styles.owner}>
          <OwnerFilter
            selectedOwners={owners}
            onChangeOwners={handleOwners}
          />
        </Box>
      )}
    </Box>
  );
});

SchedulesFilters.displayName = 'SchedulesFilters';

/** @type {MuiSx} */
const schedulesFiltersStyles = () => ({
  bar: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', width: '100%' },
  search: { minWidth: '12.5rem', marginRight: '0.25rem' },
  // Same label and select sizes as the status filter of Agents and Pipelines
  control: { display: 'flex', minWidth: '7.3125rem', gap: '0.75rem', alignItems: 'center', height: '100%' },
  labelBox: { height: '1.5rem' },
  selectBox: { flex: 1 },
  select: { margin: '0.3125rem 0 0 0 !important' },
  owner: { minWidth: '15rem' },
});

export default SchedulesFilters;
