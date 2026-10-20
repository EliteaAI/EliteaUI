import { useCallback, useEffect, useState } from 'react';

import { useGetScheduleListQuery } from '@/[fsd]/entities/schedule';
import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import { PAGE_SIZE, PERMISSIONS, SortOrderOptions } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils';
import StickyTabs from '@/components/StickyTabs';
import useCheckPermission from '@/hooks/useCheckPermission';

import SchedulesFilters from './SchedulesFilters';
import SchedulesTable from './SchedulesTable';

const NO_FILTERS = { entityType: '', status: '', enabled: '', search: '', ownerIds: [] };

const SchedulesPage = () => {
  const projectId = useSelectedProjectId();
  const { toastError } = useToast();
  const { checkPermission } = useCheckPermission();
  const isAdmin = checkPermission(PERMISSIONS.schedules.admin);
  const [filters, setFilters] = useState(NO_FILTERS);
  const [page, setPage] = useState(0);
  const [pageProjectId, setPageProjectId] = useState(projectId);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  // The API default: the next run first
  const [sortConfig, setSortConfig] = useState({ field: 'next_run', direction: SortOrderOptions.ASC });

  // A project switch restarts at the first page, before any request for the new project
  if (pageProjectId !== projectId) {
    setPageProjectId(projectId);
    setPage(0);
  }

  // currentData is empty while another project or page loads, so no row of another project shows
  const { currentData, isFetching, isError, error } = useGetScheduleListQuery(
    {
      projectId,
      page,
      pageSize,
      sortBy: sortConfig.field,
      sortOrder: sortConfig.direction,
      ...filters,
      ownerIds: isAdmin ? filters.ownerIds : undefined,
    },
    { skip: !projectId },
  );

  useEffect(() => {
    if (isError) toastError(buildErrorMessage(error));
  }, [error, isError, toastError]);

  // Any filter or search change starts at the first page (R1.3)
  const onFiltersChange = useCallback(next => {
    setFilters(next);
    setPage(0);
  }, []);
  const hasFilters = JSON.stringify(filters) !== JSON.stringify(NO_FILTERS);

  const onPageChange = useCallback(newPage => setPage(newPage), []);
  const onChangePageSize = useCallback(size => {
    setPageSize(size);
    setPage(0);
  }, []);
  // A new sort starts at the first page, like the Notification center table
  const onSort = useCallback(field => {
    setSortConfig(prev => ({
      field,
      direction:
        prev.field === field && prev.direction === SortOrderOptions.ASC
          ? SortOrderOptions.DESC
          : SortOrderOptions.ASC,
    }));
    setPage(0);
  }, []);

  // The page title row of Credentials, Agents and Pipelines
  return (
    <StickyTabs
      tabs={[
        {
          content: (
            <SchedulesTable
              rows={isError ? [] : (currentData?.rows ?? [])}
              total={isError ? 0 : (currentData?.total ?? 0)}
              isLoading={isFetching && !currentData}
              page={page}
              pageSize={pageSize}
              onPageChange={onPageChange}
              onChangePageSize={onChangePageSize}
              sortConfig={sortConfig}
              onSort={onSort}
              emptyMessage={hasFilters ? 'No schedules match the filters' : 'No schedules'}
            />
          ),
        },
      ]}
      showTitleAndSwitchBySelect
      title="Schedules"
      titleTestId="schedules-page-header"
      containerStyle={{ padding: '0 1.5rem 0 0' }}
      tabBarStyle={{ padding: '0 0 0 1.5rem' }}
      middleTabComponent={
        <SchedulesFilters
          value={filters}
          onChange={onFiltersChange}
          isAdmin={isAdmin}
        />
      }
    />
  );
};

export default SchedulesPage;
