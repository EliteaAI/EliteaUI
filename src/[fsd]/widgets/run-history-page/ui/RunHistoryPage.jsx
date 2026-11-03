import { memo, useCallback, useMemo } from 'react';

import { Link as RouterLink, useLocation, useNavigate, useParams } from 'react-router-dom';

import { Box, Link } from '@mui/material';

import { RunHistoryContainer, SCHEDULE_RUN_COLUMNS } from '@/[fsd]/entities/run-history';
import {
  buildOwnerViewModeParams,
  buildScheduleFormLink,
  useAllEntitySchedules,
} from '@/[fsd]/entities/schedule';
import { ChatMessageList } from '@/[fsd]/features/chat';
import { ScheduleRunStatusChip } from '@/[fsd]/features/schedule';
import { DrawerPageHeader } from '@/[fsd]/features/settings';
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
  const { rows: schedules } = useAllEntitySchedules({
    entityType: scheduleEntityType,
    entityId: agentId,
    skip: !scheduleEntityType,
  });
  const filters = useRunHistoryFilters({ schedules, versions });
  const extraColumns = useMemo(() => {
    if (!scheduleEntityType) return undefined;
    const openable = new Set(schedules.map(schedule => schedule.id));
    const [scheduleColumn, ...rest] = SCHEDULE_RUN_COLUMNS;
    const renderSchedule = row => {
      const name = scheduleColumn.render(row);
      const scheduleId = row.schedule_run?.schedule_id;
      // A schedule the caller cannot open stays plain text, so no link leads to a dead page
      if (!openable.has(scheduleId)) return name;
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
    // The status reads with its icon and colour, as in the Runs card
    const renderStatus = row =>
      row.schedule_run ? (
        <ScheduleRunStatusChip
          status={row.schedule_run.status}
          variant="text"
        />
      ) : (
        '-'
      );
    return [
      { ...scheduleColumn, render: renderSchedule },
      ...rest.map(column => (column.id === 'status' ? { ...column, render: renderStatus } : column)),
    ];
  }, [scheduleEntityType, schedules, agentId, tab]);

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
        <RunHistoryFilters
          values={filters.values}
          options={filters.options}
          handlers={filters.handlers}
          hasFilters={filters.hasFilters}
          onClear={filters.onClear}
          hasScheduleFilter={Boolean(scheduleEntityType)}
        />
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
          queryParams={filters.queryParams}
          shareOpensHistoryTab
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
