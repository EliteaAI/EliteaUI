import { useCallback, useEffect, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';

import { Box } from '@mui/material';

import { buildNotificationQueryFilters } from '@/[fsd]/entities/notification';
import { useNotificationListQuery } from '@/api/notifications';
import { SortOrderOptions } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils';
import useDebounceValue from '@/hooks/useDebounceValue';
import useToast from '@/hooks/useToast';

import NotificationTable from './NotificationTable';

const MIN_SEARCH_LENGTH = 2;

export default function NotificationCenter() {
  const { toastError } = useToast();
  const { personal_project_id } = useSelector(state => state.user);

  const [paginationModel, setPaginationModel] = useState({
    pageSize: 50,
    page: 0,
  });

  const [sortModel, setSortModel] = useState({
    field: 'created_at',
    direction: SortOrderOptions.DESC,
  });

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounceValue(search, 600);
  const apiSearch = useMemo(
    () => (debouncedSearch.length < MIN_SEARCH_LENGTH ? '' : debouncedSearch),
    [debouncedSearch],
  );
  const notificationQueryFilters = useMemo(() => buildNotificationQueryFilters(apiSearch), [apiSearch]);

  const handleSearchChange = useCallback(value => {
    setSearch(value);
  }, []);

  useEffect(() => {
    setPaginationModel(prev => (prev.page === 0 ? prev : { ...prev, page: 0 }));
  }, [apiSearch]);

  const { data, isFetching, isError, error } = useNotificationListQuery(
    {
      projectId: personal_project_id,
      page: paginationModel.page,
      pageSize: paginationModel.pageSize,
      sortBy: sortModel.field,
      sortOrder: sortModel.direction,
      tokens: notificationQueryFilters.tokens,
    },
    { refetchOnFocus: true, skip: !personal_project_id },
  );

  useEffect(() => {
    if (isError) {
      toastError(buildErrorMessage(error));
    }
  }, [error, isError, toastError]);

  const styles = notificationCenterStyles();

  return (
    <Box sx={styles.container}>
      <NotificationTable
        rows={isError ? [] : (data?.rows ?? [])}
        rowCount={data?.total || 0}
        isFetching={isFetching}
        setPaginationModel={setPaginationModel}
        paginationModel={paginationModel}
        sortModel={sortModel}
        setSortModel={setSortModel}
        search={search}
        onSearchChange={handleSearchChange}
      />
    </Box>
  );
}

/** @type {MuiSx} */
const notificationCenterStyles = () => ({
  container: ({ palette, spacing }) => ({
    px: spacing(2),
    overflow: 'scroll',
    height: '100vh',
    backgroundColor: palette.background.tabPanel,
  }),
});
