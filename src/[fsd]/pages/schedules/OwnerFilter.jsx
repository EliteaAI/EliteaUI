import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { debounce } from '@mui/material';

import { useToast, useUserList } from '@/[fsd]/shared/lib/hooks';
import { Autocomplete } from '@/[fsd]/shared/ui';
import { buildErrorMessage } from '@/common/utils';

const SEARCH_DELAY_MS = 300;
const USERS_PAGE_SIZE = 20;
const SCROLL_THRESHOLD = 10;

const keepServerResult = options => options;

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

  return (
    <Autocomplete.UserSearchSelect
      userList={userList}
      selectedUsers={selectedOwners}
      onChangeUsers={onChangeOwners}
      filterOptions={keepServerResult}
      limitTags={1}
      onInputChange={handleInputChange}
      slotProps={{ listBox: { onScroll: handleScroll } }}
    />
  );
});

OwnerFilter.displayName = 'OwnerFilter';

export default OwnerFilter;
