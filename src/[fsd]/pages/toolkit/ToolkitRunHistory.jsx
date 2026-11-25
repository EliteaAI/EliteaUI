import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Navigate, Link as RouterLink, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { Box, Link } from '@mui/material';

import { RUN_HISTORY_LAYOUTS } from '@/[fsd]/entities/run-history/lib/constants/runHistory.constants';
import { RunHistoryContainer, RunStatusCell } from '@/[fsd]/entities/run-history/ui';
import { ChatMessageList } from '@/[fsd]/features/chat';
import { DrawerPageHeader } from '@/[fsd]/features/settings';
import { ToolkitsHelpers } from '@/[fsd]/features/toolkits';
import { buildRunHistoryRowDecorator } from '@/[fsd]/features/toolkits/indexes/lib/helpers';
import {
  MCP_RUN_OUTCOMES,
  decorateMcpRow,
} from '@/[fsd]/features/toolkits/indexes/lib/helpers/mcpRunRow.helpers';
import { useToolkitIndexRuns } from '@/[fsd]/features/toolkits/indexes/lib/hooks';
import { useToolkitRunFilters } from '@/[fsd]/features/toolkits/indexes/lib/hooks/useToolkitRunFilters.hooks';
import { IndexRunDetail } from '@/[fsd]/features/toolkits/indexes/ui';
import { ParticipantEntityConstants } from '@/[fsd]/shared/lib/constants';
import { NavigationHelpers } from '@/[fsd]/shared/lib/helpers';
import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import Breadcrumbs from '@/[fsd]/shared/ui/breadcrumbs';
import { UntrustedMarkdownBoundary } from '@/[fsd]/shared/ui/markdown';
import { useRunHistoryFilters } from '@/[fsd]/widgets/run-history-page/lib/hooks/useRunHistoryFilters.hooks';
import RunHistoryFilters from '@/[fsd]/widgets/run-history-page/ui/RunHistoryFilters';
import { useToolkitsDetailsQuery } from '@/api/toolkits.js';
import { buildErrorMessage, isNotFoundError } from '@/common/utils.jsx';
import RouteDefinitions from '@/routes';

const { ParticipantEntityTypes } = ParticipantEntityConstants;
const NO_INDEX_NAMES = [];
const NO_KEEP_KEYS = [];
const MCP_ALWAYS_SHOWN_FILTERS = ['event'];
const NO_SCHEDULES = [];
const NO_ADDITIONAL_ROWS = [];
const NO_VERSIONS = [];

// The Index column: a link to the index page, or a hyphen for a tool-call row (AC-35, AC-37)
const renderIndexCell = (row, { tab, toolkitId }) => {
  if (!row.index_name) return '-';
  return (
    <Link
      component={RouterLink}
      to={NavigationHelpers.buildRoute(RouteDefinitions.ToolkitIndex, {
        tab: tab ?? 'all',
        toolkitId,
        indexName: row.index_name,
      })}
      onClick={event => event.stopPropagation()}
      variant="bodyMedium"
      underline="always"
    >
      {row.index_name}
    </Link>
  );
};

const renderStatusCell = row => <RunStatusCell status={row.run_status} />;

const ToolkitRunHistory = memo(() => {
  const { tab, toolkitId, mcpId } = useParams();
  const [searchParams] = useSearchParams();
  const entityId = mcpId ?? toolkitId;
  const isMCP = !!mcpId;
  const isLegacyMcpLink = !mcpId && searchParams.get('isMCP') === 'true';
  const navigate = useNavigate();
  const projectId = useSelectedProjectId();
  const { toastError } = useToast();
  const styles = getStyles();

  const goToList = useCallback(() => {
    const listRoute = isMCP ? RouteDefinitions.MCPsWithTab : RouteDefinitions.ToolkitsWithTab;
    navigate(NavigationHelpers.buildRoute(listRoute, { tab: tab ?? 'all' }));
  }, [isMCP, navigate, tab]);

  const { isError, error } = useToolkitsDetailsQuery(
    { projectId, toolkitId: entityId },
    { skip: !projectId || !entityId },
  );

  // Scheduler-started runs create no conversation, so nothing else surfaces them.
  const { indexRunRows, indexRunLookup, indexNames, isIndexRunsLoading } = useToolkitIndexRuns({
    projectId,
    toolkitId: entityId,
    skip: isMCP || isLegacyMcpLink,
  });

  // Toolkit filters (AC-39, AC-40): Event and Index hide the tool-call rows, Status sends run_outcome for them
  const filters = useToolkitRunFilters({
    indexNames: isMCP ? NO_INDEX_NAMES : indexNames,
    enabled: !isMCP,
  });
  const filteredIndexRows = useMemo(() => filters.filterIndexRows(indexRunRows), [filters, indexRunRows]);

  // MCP filters (AC-45): Event lists the tools of this MCP that have runs, Status the MCP outcomes
  const [mcpToolNames, setMcpToolNames] = useState([]);
  // The tools the Event filter lists (AC-45) grow as runs load: a name already seen stays listed, so ticking one
  // tool never drops the others from the options
  const handleMcpRowsChange = useCallback(rows => {
    const seen = rows.flatMap(row => row.tool_names ?? []);
    setMcpToolNames(previous => {
      const merged = [...new Set([...previous, ...seen])].sort();
      return merged.length === previous.length ? previous : merged;
    });
  }, []);
  const mcpFilters = useRunHistoryFilters({
    schedules: NO_SCHEDULES,
    versions: NO_VERSIONS,
    toolNames: mcpToolNames,
  });
  const mcpStatusOptions = useMemo(
    () => mcpFilters.options.status.filter(option => MCP_RUN_OUTCOMES.includes(option.value)),
    [mcpFilters.options.status],
  );
  const mcpFilterValues = useMemo(
    () => ({ event: mcpFilters.values.tool, status: mcpFilters.values.status }),
    [mcpFilters.values],
  );
  const mcpFilterOptions = useMemo(
    () => ({ event: mcpFilters.options.tool, status: mcpStatusOptions }),
    [mcpFilters.options.tool, mcpStatusOptions],
  );
  const mcpFilterHandlers = useMemo(
    () => ({ event: mcpFilters.handlers.tool, status: mcpFilters.handlers.status }),
    [mcpFilters.handlers],
  );

  const extraColumns = useMemo(
    () =>
      isMCP
        ? [{ id: 'status', label: 'Status', width: '9.5rem', render: renderStatusCell }]
        : [
            {
              id: 'index',
              label: 'Index',
              width: '10rem',
              render: row => renderIndexCell(row, { tab, toolkitId }),
            },
            {
              id: 'status',
              label: 'Status',
              width: '9.5rem',
              render: renderStatusCell,
            },
          ],
    [isMCP, tab, toolkitId],
  );

  const decorateRow = useMemo(
    () => buildRunHistoryRowDecorator({ lookup: indexRunLookup, isLookupReady: !isIndexRunsLoading }),
    [indexRunLookup, isIndexRunsLoading],
  );

  const shouldShowNotFoundPage = isError && isNotFoundError(error);

  useEffect(() => {
    if (isError && !shouldShowNotFoundPage) toastError(buildErrorMessage(error));
  }, [error, isError, shouldShowNotFoundPage, toastError]);

  useEffect(() => {
    if (shouldShowNotFoundPage) goToList();
  }, [shouldShowNotFoundPage, goToList]);

  if (isLegacyMcpLink) {
    const target = NavigationHelpers.buildRoute(RouteDefinitions.MCPRunHistory, {
      tab: tab ?? 'all',
      mcpId: toolkitId,
    });
    const preserved = new URLSearchParams(searchParams);
    preserved.delete('isMCP');
    const search = preserved.toString();
    return (
      <Navigate
        replace
        to={{ pathname: target, search: search ? `?${search}` : '' }}
      />
    );
  }

  if (shouldShowNotFoundPage) return null;

  return (
    <Box sx={styles.wrapper}>
      <DrawerPageHeader
        showBorder
        title={<Breadcrumbs />}
      />
      <Box sx={styles.content}>
        <RunHistoryFilters
          filterKeys={isMCP ? RUN_HISTORY_LAYOUTS.mcp.filters : RUN_HISTORY_LAYOUTS.toolkit.filters}
          values={isMCP ? mcpFilterValues : filters.values}
          options={isMCP ? mcpFilterOptions : filters.options}
          handlers={isMCP ? mcpFilterHandlers : filters.handlers}
          hasFilters={isMCP ? mcpFilters.hasFilters : filters.hasFilters}
          onClear={isMCP ? mcpFilters.onClear : filters.onClear}
          hasScheduleFilter={false}
          // The MCP Event filter stays drawn while it has no tool yet, since its tools come from the loaded runs
          keepEmptyKeys={isMCP ? MCP_ALWAYS_SHOWN_FILTERS : NO_KEEP_KEYS}
        />
        <UntrustedMarkdownBoundary>
          <RunHistoryContainer
            // A new filter restarts paging at page 1
            key={JSON.stringify(isMCP ? mcpFilters.queryParams : filters.queryParams)}
            entityId={entityId}
            source={isMCP ? ParticipantEntityTypes.MCP : ParticipantEntityTypes.Toolkit}
            versions={null}
            ChatMessageListComponent={ChatMessageList}
            prettifyConversation={ToolkitsHelpers.prettifyToolkitConversation}
            additionalRows={isMCP ? NO_ADDITIONAL_ROWS : filteredIndexRows}
            additionalRowsLoading={isIndexRunsLoading}
            decorateRow={isMCP ? decorateMcpRow : decorateRow}
            DetailComponent={IndexRunDetail}
            extraColumns={extraColumns}
            queryParams={isMCP ? mcpFilters.queryParams : filters.queryParams}
            // An Event or Index tick shows index runs only (AC-39, AC-40); a Status tick sends run_outcome for chats
            skipConversations={!isMCP && !filters.showConversations}
            onRowsChange={isMCP ? handleMcpRowsChange : undefined}
          />
        </UntrustedMarkdownBoundary>
      </Box>
    </Box>
  );
});

ToolkitRunHistory.displayName = 'ToolkitRunHistory';

/** @type {MuiSx} */
const getStyles = () => ({
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    padding: '1rem 1.5rem',
    gap: '1rem',
    overflow: 'hidden',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '2rem 0',
  },
  body: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    gap: '1.5rem',
    overflow: 'hidden',
  },
  historyColumn: {
    flex: '0 0 24rem',
    minWidth: '20rem',
    maxWidth: '28rem',
    overflow: 'hidden',
  },
  chatColumn: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  chatContainer: {
    height: '100%',
  },
});

export default ToolkitRunHistory;
