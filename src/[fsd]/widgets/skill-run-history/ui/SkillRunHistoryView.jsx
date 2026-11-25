import { memo, useCallback, useMemo } from 'react';

import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { Box } from '@mui/material';

import { RUN_HISTORY_LAYOUTS } from '@/[fsd]/entities/run-history/lib/helpers/runHistoryConfig.helpers';
import { RunHistoryContainer } from '@/[fsd]/entities/run-history/ui';
import { ChatMessageList } from '@/[fsd]/features/chat';
import { ScheduleRunStatusChip } from '@/[fsd]/features/schedule';
import { DrawerPageHeader } from '@/[fsd]/features/settings';
import { SKILL_RUN_SEARCH_PARAMS } from '@/[fsd]/features/skill/lib/constants';
import { ParticipantEntityConstants } from '@/[fsd]/shared/lib/constants';
import { NavigationHelpers } from '@/[fsd]/shared/lib/helpers';
import Breadcrumbs from '@/[fsd]/shared/ui/breadcrumbs';
import { useRunHistoryFilters } from '@/[fsd]/widgets/run-history-page/lib/hooks/useRunHistoryFilters.hooks';
import RunHistoryFilters from '@/[fsd]/widgets/run-history-page/ui/RunHistoryFilters';
import { useSkillHistoryEntity } from '@/[fsd]/widgets/skill-run-history/lib/hooks';
import { SearchParams, SkillsTabs } from '@/common/constants';
import RouteDefinitions from '@/routes';

const { ParticipantEntityTypes } = ParticipantEntityConstants;
const NO_SCHEDULES = [];
const NO_TOOL_NAMES = [];
// Every skill run is a chat run, so the Event column reads Chat (ticket AC-31)
const SKILL_EVENT_LABEL = 'Chat';

const SkillRunHistoryView = memo(props => {
  const { isCatalogSkill = false } = props;
  const { tab = SkillsTabs[0] } = useParams();
  const navigate = useNavigate();
  const { search } = useLocation();
  const styles = skillRunHistoryViewStyles();

  const { skillId, skill, versions, entityProjectId } = useSkillHistoryEntity({ isCatalogSkill });
  const filters = useRunHistoryFilters({
    schedules: NO_SCHEDULES,
    versions,
    toolNames: NO_TOOL_NAMES,
  });
  const filterKeys = RUN_HISTORY_LAYOUTS.skill.filters;
  const decorateRow = useCallback(row => ({ ...row, event_label: SKILL_EVENT_LABEL }), []);
  const extraColumns = useMemo(
    () => [
      {
        id: 'status',
        label: 'Status',
        width: '9.5rem',
        render: row =>
          row.run_status ? (
            <ScheduleRunStatusChip
              status={row.run_status}
              variant="text"
            />
          ) : (
            '-'
          ),
      },
    ],
    [],
  );

  const openInChat = useCallback(
    conversationId => navigate(`${RouteDefinitions.Chat}/${conversationId}`),
    [navigate],
  );

  const restoreIntoRunPanel = useCallback(
    conversationId => {
      const returnParams = new URLSearchParams(search);
      returnParams.delete(SKILL_RUN_SEARCH_PARAMS.run);
      returnParams.delete(SearchParams.HistoryRunId);
      const query = returnParams.toString();
      navigate(
        `${NavigationHelpers.buildRoute(RouteDefinitions.SkillsDetail, { tab, skillId })}${query ? `?${query}` : ''}`,
        { state: { restoredConversationID: conversationId } },
      );
    },
    [navigate, search, skillId, tab],
  );

  const restoreConversation = useCallback(
    (conversationId, isChatRun) =>
      isCatalogSkill || isChatRun ? openInChat(conversationId) : restoreIntoRunPanel(conversationId),
    [isCatalogSkill, openInChat, restoreIntoRunPanel],
  );

  const handleOpenAnalytics = useCallback(
    conversationId => {
      const params = new URLSearchParams(search);
      params.set(SearchParams.HistoryRunId, String(conversationId));
      const analyticsRoute = isCatalogSkill
        ? NavigationHelpers.buildRoute(RouteDefinitions.CatalogSkillRunAnalytics, { skillId })
        : NavigationHelpers.buildRoute(RouteDefinitions.SkillsRunAnalytics, { tab, skillId });
      navigate(`${analyticsRoute}?${params.toString()}`);
    },
    [isCatalogSkill, navigate, search, skillId, tab],
  );

  return (
    <Box sx={styles.wrapper}>
      <DrawerPageHeader
        showBorder
        title={<Breadcrumbs entityName={skill?.name} />}
      />
      <Box sx={styles.content}>
        <RunHistoryFilters
          filterKeys={filterKeys}
          values={filters.values}
          options={filters.options}
          handlers={filters.handlers}
          hasFilters={filters.hasFilters}
          onClear={filters.onClear}
          hasScheduleFilter={false}
          hasComplexityFilter={false}
        />
        <RunHistoryContainer
          // A new filter restarts paging at page 1
          key={JSON.stringify(filters.queryParams)}
          entityId={skillId}
          entityProjectId={entityProjectId}
          source={ParticipantEntityTypes.Skill}
          versions={versions}
          handleRestoreConversation={restoreConversation}
          handleOpenAnalytics={handleOpenAnalytics}
          ChatMessageListComponent={ChatMessageList}
          decorateRow={decorateRow}
          eventColumnLabel="Event"
          extraColumns={extraColumns}
          queryParams={filters.queryParams}
          shareOpensHistoryTab
        />
      </Box>
    </Box>
  );
});

SkillRunHistoryView.displayName = 'SkillRunHistoryView';

/** @type {MuiSx} */
const skillRunHistoryViewStyles = () => ({
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

export default SkillRunHistoryView;
