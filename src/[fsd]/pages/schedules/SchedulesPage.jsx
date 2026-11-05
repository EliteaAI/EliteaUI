import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { Chip } from '@mui/material';

import { useGetScheduleListQuery } from '@/[fsd]/entities/schedule';
import { getPollingInterval } from '@/[fsd]/features/schedule';
import { ScheduleImportExportActions } from '@/[fsd]/features/schedule-import-export';
import { DrawerPage, DrawerPageBody, DrawerPageHeader } from '@/[fsd]/features/settings';
import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import { SchedulesFilters, SchedulesTable } from '@/[fsd]/widgets/schedules-table';
import { PAGE_SIZE, PERMISSIONS, SortOrderOptions } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils';
import useCheckPermission from '@/hooks/useCheckPermission';
import RouteDefinitions from '@/routes';

const ENTITY_TYPE_LABELS = { agent: 'Agent', pipeline: 'Pipeline' };

const NO_FILTERS = { entityType: '', status: '', enabled: '', search: '', ownerIds: [], webhookType: '' };

// One page for both row kinds; a webhook is a schedule row with trigger_kind 'webhook'
const KINDS = {
  cron: {
    title: 'Schedules',
    noun: 'schedule',
    testId: 'schedules',
    createRoute: RouteDefinitions.CreateSchedule,
    // The API default: the next run first
    sort: { field: 'next_run', direction: SortOrderOptions.ASC },
  },
  webhook: {
    title: 'Webhooks',
    noun: 'webhook',
    testId: 'webhooks',
    createRoute: RouteDefinitions.CreateWebhook,
    sort: { field: 'last_run', direction: SortOrderOptions.DESC },
  },
};

const SchedulesPage = memo(props => {
  const { kind = 'cron' } = props;
  const config = KINDS[kind];
  const isWebhook = kind === 'webhook';
  const projectId = useSelectedProjectId();
  const { toastError } = useToast();
  const { checkPermission } = useCheckPermission();
  const isAdmin = checkPermission(PERMISSIONS.schedules.admin);
  const canCreate = checkPermission(PERMISSIONS.schedules.create);
  const navigate = useNavigate();
  const [filters, setFilters] = useState(NO_FILTERS);
  const [page, setPage] = useState(0);
  const [pageProjectId, setPageProjectId] = useState(projectId);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [sortConfig, setSortConfig] = useState(config.sort);
  // "Open all in Schedules" of an editor: the one filter the page keeps in its URL
  const [searchParams, setSearchParams] = useSearchParams();
  const urlEntityType = searchParams.get('entityType');
  const urlEntityId = searchParams.get('entityId');
  const urlEntity =
    urlEntityType && urlEntityId ? { entityType: urlEntityType, entityId: urlEntityId } : null;
  // The editor link carries the entity name, so the chip names it even when the list has no rows
  const { state: locationState } = useLocation();

  // A project switch clears the filters and restarts at the first page, before any request
  if (pageProjectId !== projectId) {
    setPageProjectId(projectId);
    setFilters(NO_FILTERS);
    setPage(0);
  }

  // currentData is empty while another project or page loads, so no row of another project shows
  const queryArgs = {
    projectId,
    page,
    pageSize,
    sortBy: sortConfig.field,
    sortOrder: sortConfig.direction,
    ...filters,
    ...urlEntity,
    ownerIds: isAdmin ? filters.ownerIds : undefined,
    // Unset on the Schedules page: the server lists cron rows by default
    triggerKind: isWebhook ? 'webhook' : undefined,
    webhookType: isWebhook ? filters.webhookType : undefined,
  };
  const { currentData, isFetching, isError, error } = useGetScheduleListQuery(queryArgs, {
    skip: !projectId,
  });
  // The same args share one cache entry; this subscription only adds the polling the rows ask for
  useGetScheduleListQuery(queryArgs, {
    skip: !projectId,
    pollingInterval: getPollingInterval(currentData?.rows),
  });

  useEffect(() => {
    if (isError) toastError(buildErrorMessage(error));
  }, [error, isError, toastError]);

  // The last row of a page goes (delete, filter by status): step back to the last page that has rows
  const total = currentData?.total;
  const hasNoRows = currentData && !currentData.rows?.length;
  useEffect(() => {
    if (!hasNoRows || page <= 0) return;
    // Without a total the page cannot be computed: go back one page
    setPage(Number.isFinite(total) ? Math.max(Math.ceil(total / pageSize) - 1, 0) : page - 1);
  }, [hasNoRows, page, pageSize, total]);

  // Any filter or search change starts at the first page
  const onFiltersChange = useCallback(next => {
    setFilters(next);
    setPage(0);
  }, []);
  const hasFilters = Boolean(
    filters.entityType ||
    filters.status ||
    filters.enabled !== '' ||
    filters.search ||
    filters.webhookType ||
    filters.ownerIds.length,
  );

  const onClearFilters = useCallback(() => onFiltersChange(NO_FILTERS), [onFiltersChange]);
  const onClearUrlEntity = useCallback(() => {
    setSearchParams(prev => {
      prev.delete('entityType');
      prev.delete('entityId');
      return prev;
    });
    setPage(0);
  }, [setSearchParams]);

  // A project switch also drops the entity of the old project from the URL
  const urlProjectId = useRef();
  useEffect(() => {
    if (projectId == null) return;
    urlProjectId.current ??= projectId;
    if (projectId === urlProjectId.current) return;
    urlProjectId.current = projectId;
    if (urlEntityId) onClearUrlEntity();
  }, [projectId, urlEntityId, onClearUrlEntity]);

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

  const onAdd = useCallback(() => navigate(config.createRoute), [navigate, config.createRoute]);

  // The Settings page header of Secrets: title, the import and export actions, the round + button
  return (
    <DrawerPage>
      <DrawerPageHeader
        title={config.title}
        titleTestId={`${config.testId}-page-header`}
        // The export file holds schedules only, so the Webhooks page has + alone
        extraContent={isWebhook ? undefined : <ScheduleImportExportActions projectId={projectId} />}
        showAddButton={canCreate}
        slotProps={{
          addButton: { onAdd, tooltip: `Create new ${config.noun}`, testId: `${config.testId}-add-button` },
        }}
      />
      <DrawerPageBody>
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
          kind={kind}
          emptyMessage={
            hasFilters || urlEntity ? `No ${config.noun}s match the filters` : `No ${config.noun}s`
          }
          toolbar={
            <>
              <SchedulesFilters
                key={projectId}
                value={filters}
                onChange={onFiltersChange}
                onClear={onClearFilters}
                hasFilters={hasFilters}
                isAdmin={isAdmin}
                // The chip sets the type, so a Type select could contradict the list
                hideEntityType={Boolean(urlEntity)}
                showWebhookType={isWebhook}
              />
              {urlEntity && (
                <Chip
                  data-testid={`${config.testId}-entity-chip`}
                  label={`${ENTITY_TYPE_LABELS[urlEntityType] ?? urlEntityType}: ${locationState?.entityName ?? currentData?.rows?.[0]?.entity_name ?? urlEntityId}`}
                  onDelete={onClearUrlEntity}
                />
              )}
            </>
          }
        />
      </DrawerPageBody>
    </DrawerPage>
  );
});

SchedulesPage.displayName = 'SchedulesPage';

export default SchedulesPage;
