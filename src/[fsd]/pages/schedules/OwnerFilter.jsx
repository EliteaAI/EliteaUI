import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Box, Chip, Typography, debounce } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { useToast, useUserList } from '@/[fsd]/shared/lib/hooks';
import { Autocomplete } from '@/[fsd]/shared/ui';
import RemoveIcon from '@/assets/remove-icon.svg?react';
import { buildErrorMessage } from '@/common/utils';
import UserAvatar from '@/components/UserAvatar';

const SEARCH_DELAY_MS = 300;
const USERS_PAGE_SIZE = 20;
const SCROLL_THRESHOLD = 10;

const keepServerResult = options => options;

// The chip removes itself on Backspace and Delete; the Autocomplete root would also remove an owner
const stopChipDeleteKeys = event => {
  if (event.key === 'Backspace' || event.key === 'Delete') event.stopPropagation();
};

const OwnerFilter = memo(({ selectedOwners, onChangeOwners }) => {
  const { toastError } = useToast();
  const [query, setQuery] = useState('');
  const debouncedSetQuery = useMemo(() => debounce(setQuery, SEARCH_DELAY_MS), []);
  useEffect(() => () => debouncedSetQuery.clear(), [debouncedSetQuery]);

  const { onLoadMoreUsers, data, isUsersError, isUsersFetching, usersError } = useUserList({
    sortBy: 'name',
    sortOrder: 'asc',
    query,
    pageSize: USERS_PAGE_SIZE,
  });
  const { rows = [], total = 0 } = data || {};

  // Chosen owners stay in the list, so a new search never drops them
  const userList = useMemo(() => {
    const users = rows.map(user => ({ ...user, name: user.name || user.email || '' }));
    return [...selectedOwners.filter(owner => !users.some(user => user.id === owner.id)), ...users];
  }, [rows, selectedOwners]);

  useEffect(() => {
    if (isUsersError) toastError(buildErrorMessage(usersError));
  }, [isUsersError, usersError, toastError]);

  const handleScroll = useCallback(
    event => {
      const listbox = event.currentTarget;
      const atEnd = listbox.scrollTop + listbox.clientHeight >= listbox.scrollHeight - SCROLL_THRESHOLD;
      if (atEnd && !isUsersFetching && total > rows.length) onLoadMoreUsers();
    },
    [isUsersFetching, total, rows.length, onLoadMoreUsers],
  );

  const handleInputChange = useCallback((_, value) => debouncedSetQuery(value), [debouncedSetQuery]);

  // MUI ignores limitTags while the field has focus, so the field always shows the first owner and "+N"
  const styles = ownerFilterStyles();
  const renderValue = useCallback(
    (value, getItemProps) => {
      if (!value.length) return null;
      const [first, ...others] = value;
      const { key: firstKey, ...firstItemProps } = getItemProps({ index: 0 });
      const otherNames = others.map(owner => owner.name);
      return (
        <>
          <Chip
            key={firstKey}
            data-testid="schedules-owner-chip"
            sx={styles.chip}
            label={
              <Box sx={styles.chipLabel}>
                <UserAvatar
                  name={first.name}
                  avatar={first.avatar}
                  size={16}
                />
                <Typography
                  variant="bodySmall"
                  color="text.secondary"
                  noWrap
                >
                  {first.name}
                </Typography>
              </Box>
            }
            deleteIcon={<RemoveIcon fill="currentColor" />}
            {...firstItemProps}
            onKeyDown={stopChipDeleteKeys}
          />
          {others.length > 0 && (
            <StyledTooltip
              title={otherNames.join('\n')}
              placement="top"
              extraStyles={{ whiteSpace: 'pre-line' }}
            >
              <Chip
                data-testid="schedules-owner-more"
                tabIndex={0}
                aria-label={`${others.length} more owners: ${otherNames.join(', ')}`}
                sx={[styles.chip, styles.more]}
                label={
                  <Typography
                    variant="bodySmall"
                    color="text.secondary"
                  >
                    +{others.length}
                  </Typography>
                }
              />
            </StyledTooltip>
          )}
        </>
      );
    },
    [styles],
  );

  return (
    <Autocomplete.UserSearchSelect
      userList={userList}
      selectedUsers={selectedOwners}
      onChangeUsers={onChangeOwners}
      filterOptions={keepServerResult}
      renderValue={renderValue}
      onInputChange={handleInputChange}
      slotProps={{ listBox: { onScroll: handleScroll } }}
    />
  );
});

OwnerFilter.displayName = 'OwnerFilter';

/** @type {MuiSx} */
const ownerFilterStyles = () => ({
  // The chip look of the shared drop-down
  chip: ({ palette }) => ({
    height: '1.5rem',
    margin: '0 !important',
    backgroundColor: palette.components.autocompleteChip.background.disabled,
    '& .MuiChip-label': { paddingLeft: '0.5rem', paddingRight: '0.5rem' },
    '& .MuiChip-deleteIcon': { color: palette.icon.default, marginLeft: 0 },
    '& .MuiChip-deleteIcon:hover': { color: palette.icon.secondary },
  }),
  chipLabel: { display: 'flex', alignItems: 'center', gap: '0.25rem', minWidth: 0 },
  more: { flexShrink: 0 },
});

export default OwnerFilter;
