import { memo, useCallback, useMemo, useState } from 'react';

import { Link as RouterLink, useLocation, useNavigate, useParams } from 'react-router-dom';

import { Box, Link } from '@mui/material';

import { RunHistoryContainer, RunStatusCell, SCHEDULE_RUN_COLUMNS } from '@/[fsd]/entities/run-history';
import { RUN_HISTORY_LAYOUTS } from '@/[fsd]/entities/run-history/lib/constants/runHistory.constants';
import {
  TRIGGER_KIND,
  buildOwnerViewModeParams,
  buildScheduleFormLink,
  useAllEntitySchedules,
} from '@/[fsd]/entities/schedule';
import { ChatMessageList } from '@/[fsd]/features/chat';
import { DrawerPageHeader } from '@/[fsd]/features/settings';
import { useRunComplexityColumn } from '@/[fsd]/features/settings/ui/complexity';
import { ToolkitsHelpers } from '@/[fsd]/features/toolkits';
import { NavigationConstants } from '@/[fsd]/shared/lib/constants';
import { NavigationHelpers } from '@/[fsd]/shared/lib/helpers';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import Breadcrumbs from '@/[fsd]/shared/ui/breadcrumbs';
import { useApplicationDetailsQuery } from '@/api/applications';
import { SearchParams } from '@/common/constants';

import { useRunHistoryFilters } from '../lib/hooks/useRunHistoryFilters.hooks';
import RunHistoryFilters from './RunHistoryFilters';

const DEFAULT_TAB = 'all';
// The Schedule/Webhook filter is always drawn on an agent or pipeline (design), even before any schedule exists
const SCHEDULE_ALWAYS_SHOWN = ['schedule'];
// The mark for a cell with no value: a hyphen, the same on every page (set by the requester)
const NO_VALUE = '-';

// The mockup draws the schedule name in the bright text tone, underlined, not in the link blue
const scheduleLinkSx = ({ palette }) => ({
  color: palette.text.secondary,
  '&:hover': { color: palette.text.secondary },
});

const RunHistoryPage = memo(props => {
  const { source, detailRoute, analyticsRoute, eventColumnLabel, decorateRow, scheduleEntityType } = props;
  const { tab, agentId } = useParams();
  const navigate = useNavigate();
  const { search } = useLocation();
  const projectId = useSelectedProjectId();
  const styles = runHistoryPageStyles();

  const { data } = useApplicationDetailsQuery(
    { projectId, applicationId: agentId },
    { skip: !projectId || !agentId },
  );
  const versions = data?.versions ?? [];

  // The caller's schedules of this agent or pipeline fill the filter and decide which names link
  const { rows: cronSchedules } = useAllEntitySchedules({
    entityType: scheduleEntityType,
    entityId: agentId,
    triggerKind: TRIGGER_KIND.cron,
    skip: !scheduleEntityType,
  });
  const { rows: webhooks } = useAllEntitySchedules({
    entityType: scheduleEntityType,
    entityId: agentId,
    triggerKind: TRIGGER_KIND.webhook,
    skip: !scheduleEntityType,
  });
  const schedules = useMemo(() => [...cronSchedules, ...webhooks], [cronSchedules, webhooks]);
  const [loadedRows, setLoadedRows] = useState([]);
  // The tool names of the loaded runs feed the MCP Event filter (the facets endpoint gives the full list later)
  const toolNames = useMemo(
    () => [...new Set(loadedRows.flatMap(row => row.tool_names ?? []))],
    [loadedRows],
  );
  const filters = useRunHistoryFilters({ schedules, versions, toolNames });
  // While a run is open it takes the whole content area, so the filter bar steps aside too
  const [runOpen, setRunOpen] = useState(false);
  const complexityColumn = useRunComplexityColumn({ entityId: agentId, rows: loadedRows });
  const scheduleColumns = useMemo(() => {
    if (!scheduleEntityType) return [];
    const kindById = new Map(schedules.map(schedule => [schedule.id, schedule.trigger_kind]));
    const [scheduleColumn, ...rest] = SCHEDULE_RUN_COLUMNS;
    const renderSchedule = row => {
      const name = scheduleColumn.render(row);
      const scheduleId = row.schedule_run?.schedule_id;
      // A schedule the caller cannot open stays plain text, so no link leads to a dead page
      if (!kindById.has(scheduleId)) return name;
      return (
        // The theme link, so the name reads well in dark and light
        <Link
          component={RouterLink}
          to={{
            pathname: buildScheduleFormLink({
              entityType: scheduleEntityType,
              entityId: agentId,
              tab,
              scheduleId,
              kind: kindById.get(scheduleId),
            }),
            // Without the owner view mode the editor falls back to the public mode and fails to load
            search: `?${buildOwnerViewModeParams()}`,
          }}
          onClick={event => event.stopPropagation()}
          // A cut name shows in full on hover
          title={name}
          variant="bodyMedium"
          underline="always"
          sx={scheduleLinkSx}
        >
          {name}
        </Link>
      );
    };
    // A schedule run's own status; a chat, API or MCP row takes the server's run_status (ticket AC-24)
    const renderStatus = row => (
      <RunStatusCell
        status={row.schedule_run?.status ?? row.run_status}
        emptyMark={NO_VALUE}
      />
    );
    return [
      { ...scheduleColumn, render: renderSchedule },
      ...rest.map(column => (column.id === 'status' ? { ...column, render: renderStatus } : column)),
    ];
  }, [scheduleEntityType, schedules, agentId, tab]);
  const extraColumns = useMemo(() => {
    const columns = complexityColumn ? [...scheduleColumns, complexityColumn] : scheduleColumns;
    return columns.length ? columns : undefined;
  }, [scheduleColumns, complexityColumn]);

  const handleRestoreConversation = useCallback(
    id => {
      const { VERSION_SEARCH_PARAM } = NavigationConstants;
      const params = new URLSearchParams(search);
      const version = params.get(VERSION_SEARCH_PARAM);
      params.delete(VERSION_SEARCH_PARAM);

      const query = params.toString();

      navigate(
        NavigationHelpers.buildRoute(version ? `${detailRoute}/:version` : detailRoute, {
          tab: tab ?? DEFAULT_TAB,
          agentId,
          version,
        }) + (query ? `?${query}` : ''),
        { state: { restoredConversationID: id } },
      );
    },
    [navigate, tab, agentId, detailRoute, search],
  );

  // The run travels as `history_run_id`, so the Run History breadcrumb (which forwards the search)
  // brings the user back with the same record selected
  const handleOpenAnalytics = useCallback(
    id => {
      const params = new URLSearchParams(search);
      params.delete(SearchParams.UsageRunId);
      params.set(SearchParams.HistoryRunId, String(id));

      navigate(
        `${NavigationHelpers.buildRoute(analyticsRoute, { tab: tab ?? DEFAULT_TAB, agentId })}?${params.toString()}`,
      );
    },
    [navigate, tab, agentId, analyticsRoute, search],
  );

  return (
    <Box sx={styles.wrapper}>
      <DrawerPageHeader
        showBorder
        title={<Breadcrumbs />}
      />
      <Box sx={styles.content}>
        {!runOpen && (
          <RunHistoryFilters
            filterKeys={RUN_HISTORY_LAYOUTS[scheduleEntityType]?.filters ?? []}
            values={filters.values}
            options={filters.options}
            handlers={filters.handlers}
            hasFilters={filters.hasFilters}
            onClear={filters.onClear}
            hasScheduleFilter={Boolean(scheduleEntityType)}
            // The design draws Schedule/Webhook on every agent and pipeline, even with no schedule to pick
            keepEmptyKeys={SCHEDULE_ALWAYS_SHOWN}
          />
        )}
        <RunHistoryContainer
          // A new filter restarts paging at page 1
          key={JSON.stringify(filters.queryParams)}
          entityId={agentId}
          source={source}
          versions={versions}
          handleRestoreConversation={handleRestoreConversation}
          handleOpenAnalytics={analyticsRoute ? handleOpenAnalytics : undefined}
          ChatMessageListComponent={ChatMessageList}
          prettifyConversation={ToolkitsHelpers.prettifyToolkitConversation}
          eventColumnLabel={eventColumnLabel}
          decorateRow={decorateRow}
          extraColumns={extraColumns}
          onRowsChange={setLoadedRows}
          queryParams={filters.queryParams}
          shareOpensHistoryTab
          openInPlace
          onRunOpenChange={setRunOpen}
        />
      </Box>
    </Box>
  );
});

RunHistoryPage.displayName = 'RunHistoryPage';

/** @type {MuiSx} */
const runHistoryPageStyles = () => ({
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
});

export default RunHistoryPage;
