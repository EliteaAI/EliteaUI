import { memo, useCallback } from 'react';

import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { Box } from '@mui/material';

import { RunHistoryContainer } from '@/[fsd]/entities/run-history/ui';
import { ChatMessageList } from '@/[fsd]/features/chat';
import { DrawerPageHeader } from '@/[fsd]/features/settings';
import { SKILL_RUN_SEARCH_PARAMS } from '@/[fsd]/features/skill/lib/constants';
import { ParticipantEntityConstants } from '@/[fsd]/shared/lib/constants';
import { NavigationHelpers } from '@/[fsd]/shared/lib/helpers';
import Breadcrumbs from '@/[fsd]/shared/ui/breadcrumbs';
import { useSkillHistoryEntity } from '@/[fsd]/widgets/skill-run-history/lib/hooks';
import { SearchParams, SkillsTabs } from '@/common/constants';
import RouteDefinitions from '@/routes';

const { ParticipantEntityTypes } = ParticipantEntityConstants;

const SkillRunHistoryView = memo(props => {
  const { isCatalogSkill = false } = props;
  const { tab = SkillsTabs[0] } = useParams();
  const navigate = useNavigate();
  const { search } = useLocation();
  const styles = skillRunHistoryViewStyles();

  const { skillId, skill, versions, entityProjectId } = useSkillHistoryEntity({ isCatalogSkill });

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
        <RunHistoryContainer
          entityId={skillId}
          entityProjectId={entityProjectId}
          source={ParticipantEntityTypes.Skill}
          versions={versions}
          handleRestoreConversation={isCatalogSkill ? openInChat : restoreIntoRunPanel}
          handleOpenAnalytics={handleOpenAnalytics}
          ChatMessageListComponent={ChatMessageList}
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
