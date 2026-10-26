import { memo, useCallback, useMemo } from 'react';

import { Link as RouterLink, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { Box, Link } from '@mui/material';

import { RunHistoryContainer, SCHEDULE_RUN_COLUMNS } from '@/[fsd]/entities/run-history';
import { buildScheduleFormLink, useGetScheduleListQuery } from '@/[fsd]/entities/schedule';
import { ChatMessageList } from '@/[fsd]/features/chat';
import { DrawerPageHeader } from '@/[fsd]/features/settings';
import { ToolkitsHelpers } from '@/[fsd]/features/toolkits';
import { NavigationConstants, TextLinkConstants } from '@/[fsd]/shared/lib/constants';
import { NavigationHelpers } from '@/[fsd]/shared/lib/helpers';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import Breadcrumbs from '@/[fsd]/shared/ui/breadcrumbs';
import { SingleSelect } from '@/[fsd]/shared/ui/select';
import { useApplicationDetailsQuery } from '@/api/applications';
import { SearchParams } from '@/common/constants';

const DEFAULT_TAB = 'all';
const SCHEDULE_ID_PARAM = 'schedule_id';
const ALL_SCHEDULES = '';
// lean: one request of up to 100 rows, the list API limit (the same bound as the editor Schedules section)
const MAX_SCHEDULES = 100;
const NO_QUERY_PARAMS = {};

const RunHistoryPage = memo(props => {
  const { source, detailRoute, analyticsRoute, eventColumnLabel, decorateRow, scheduleEntityType } = props;
  const { tab, agentId } = useParams();
  const navigate = useNavigate();
  const { search } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const projectId = useSelectedProjectId();
  const styles = runHistoryPageStyles();

  const { data } = useApplicationDetailsQuery(
    { projectId, applicationId: agentId },
    { skip: !projectId || !agentId },
  );
  const versions = data?.versions ?? [];

  // The caller's schedules of this agent or pipeline fill the filter and decide which names link
  const { data: scheduleData } = useGetScheduleListQuery(
    { projectId, entityType: scheduleEntityType, entityId: agentId, pageSize: MAX_SCHEDULES },
    { skip: !scheduleEntityType || !projectId || !agentId },
  );
  const schedules = useMemo(() => scheduleData?.rows ?? [], [scheduleData]);
  // A positive whole number only: anything else (for example "abc") is ignored, not sent as NaN
  const rawScheduleId = searchParams.get(SCHEDULE_ID_PARAM) ?? ALL_SCHEDULES;
  const scheduleIdParam = /^[1-9]\d*$/.test(rawScheduleId) ? rawScheduleId : ALL_SCHEDULES;
  const queryParams = useMemo(
    () => (scheduleIdParam ? { [SCHEDULE_ID_PARAM]: Number(scheduleIdParam) } : NO_QUERY_PARAMS),
    [scheduleIdParam],
  );
  const scheduleOptions = useMemo(
    () => [
      { label: 'All schedules', value: ALL_SCHEDULES },
      ...schedules.map(schedule => ({ label: schedule.name, value: String(schedule.id) })),
      // A linked id the caller's list does not hold still shows, so the select is never blank
      ...(scheduleIdParam && !schedules.some(schedule => String(schedule.id) === scheduleIdParam)
        ? [{ label: `Schedule ${scheduleIdParam}`, value: scheduleIdParam }]
        : []),
    ],
    [schedules, scheduleIdParam],
  );
  const handleScheduleChange = useCallback(
    value => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev);
          if (value) next.set(SCHEDULE_ID_PARAM, value);
          else next.delete(SCHEDULE_ID_PARAM);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );
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
          to={buildScheduleFormLink({ entityType: scheduleEntityType, entityId: agentId, tab, scheduleId })}
          onClick={event => event.stopPropagation()}
          // A cut name shows in full on hover
          title={name}
          variant="bodyMedium"
          underline="hover"
          sx={TextLinkConstants.TEXT_LINK_SX}
        >
          {name}
        </Link>
      );
    };
    return [{ ...scheduleColumn, render: renderSchedule }, ...rest];
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
        {scheduleEntityType && (
          <Box sx={styles.filter}>
            <SingleSelect
              showBorder
              label="Schedule"
              options={scheduleOptions}
              value={scheduleIdParam}
              onValueChange={handleScheduleChange}
              // The empty value is "All schedules": show its label instead of a blank select
              displayEmpty
              // The label moves up above the shown value, as in the credential select
              shrinkLabel
              showEmptyPlaceholder={false}
              inputProps={{ 'aria-label': 'Schedule' }}
            />
          </Box>
        )}
        <RunHistoryContainer
          // A new schedule restarts paging at page 1
          key={scheduleIdParam}
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
          queryParams={queryParams}
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
  filter: {
    width: '16rem',
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
