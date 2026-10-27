import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAnalyticsChatActivityQuery } from '@/api';

import {
  CHAT_ACTIVITY_DEBOUNCE_MS,
  CHAT_ACTIVITY_DEFAULT_SORT,
  CHAT_ACTIVITY_TOP_N,
  CHAT_COLUMNS,
} from '../constants/analyticsChats.constants';

export const useAnalyticsChatsTable = ({ projectId, dateFrom, dateTo, isPersonalProject }) => {
  const [showAll, setShowAll] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState(CHAT_ACTIVITY_DEFAULT_SORT);

  const debounceTimerRef = useRef(null);
  useEffect(() => {
    clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => setDebouncedSearch(search), CHAT_ACTIVITY_DEBOUNCE_MS);
    return () => clearTimeout(debounceTimerRef.current);
  }, [search]);

  useEffect(() => {
    setShowAll(false);
    setPage(0);
    setSearch('');
    setDebouncedSearch('');
  }, [dateFrom, dateTo, projectId]);

  const columns = useMemo(
    () => CHAT_COLUMNS.filter(col => !col.teamOnly || !isPersonalProject),
    [isPersonalProject],
  );

  const tableLimit = showAll ? rowsPerPage : CHAT_ACTIVITY_TOP_N;
  const tableOffset = showAll ? page * rowsPerPage : 0;

  const { data, isFetching } = useAnalyticsChatActivityQuery(
    {
      projectId,
      dateFrom,
      dateTo,
      limit: tableLimit,
      offset: tableOffset,
      search: debouncedSearch,
      sortBy: sort.sortBy,
      sortOrder: sort.sortOrder,
    },
    { skip: !projectId },
  );

  const { total = 0, rows = [] } = data || {};

  const handleSearchChange = useCallback(event => {
    setSearch(event.target.value);
    setPage(0);
  }, []);

  const handleSort = useCallback(key => {
    setSort(previous => ({
      sortBy: key,
      sortOrder: previous.sortBy === key && previous.sortOrder === 'desc' ? 'asc' : 'desc',
    }));
    setPage(0);
  }, []);

  const handlePageChange = useCallback((_, newPage) => setPage(newPage), []);

  const handleRowsPerPageChange = useCallback(event => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const handleShowAll = useCallback(() => {
    setShowAll(true);
    setPage(0);
  }, []);

  return {
    columns,
    rows,
    total,
    isFetching,
    showAll,
    page,
    rowsPerPage,
    search,
    sort,
    handleSearchChange,
    handleSort,
    handlePageChange,
    handleRowsPerPageChange,
    handleShowAll,
  };
};
