import { memo, useCallback } from 'react';

import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { Box } from '@mui/material';

import { RunHistoryContainer } from '@/[fsd]/entities/run-history/ui';
import { ChatMessageList } from '@/[fsd]/features/chat';
import { DrawerPageHeader } from '@/[fsd]/features/settings/ui/drawer-page';
import { useSkillDetailsQuery } from '@/[fsd]/features/skill';
import { SKILL_RUN_SEARCH_PARAMS } from '@/[fsd]/features/skill/lib/constants';
import { ParticipantEntityConstants } from '@/[fsd]/shared/lib/constants';
import { NavigationHelpers } from '@/[fsd]/shared/lib/helpers';
import Breadcrumbs from '@/[fsd]/shared/ui/breadcrumbs';
import { SkillsTabs } from '@/common/constants';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import RouteDefinitions from '@/routes';

const { ParticipantEntityTypes } = ParticipantEntityConstants;
const NO_VERSIONS = [];

const SkillRunHistory = memo(() => {
  const { tab = SkillsTabs[0], skillId } = useParams();
  const navigate = useNavigate();
  const { search } = useLocation();
  const projectId = useSelectedProjectId();
  const styles = skillRunHistoryStyles();

  const { data } = useSkillDetailsQuery({ projectId, skillId }, { skip: !projectId || !skillId });

  // The restored run replaces the one the user came from, so its id is dropped from the return URL
  const handleRestoreConversation = useCallback(
    conversationId => {
      const params = new URLSearchParams(search);
      params.delete(SKILL_RUN_SEARCH_PARAMS.run);
      const query = params.toString();
      navigate(
        `${NavigationHelpers.buildRoute(RouteDefinitions.SkillsDetail, { tab, skillId })}${query ? `?${query}` : ''}`,
        { state: { restoredConversationID: conversationId } },
      );
    },
    [navigate, search, skillId, tab],
  );

  return (
    <Box sx={styles.wrapper}>
      <DrawerPageHeader
        showBorder
        title={<Breadcrumbs />}
      />
      <Box sx={styles.content}>
        <RunHistoryContainer
          entityId={skillId}
          source={ParticipantEntityTypes.Skill}
          versions={data?.versions ?? NO_VERSIONS}
          handleRestoreConversation={handleRestoreConversation}
          ChatMessageListComponent={ChatMessageList}
          shareOpensHistoryTab
        />
      </Box>
    </Box>
  );
});

SkillRunHistory.displayName = 'SkillRunHistory';

/** @type {MuiSx} */
const skillRunHistoryStyles = () => ({
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

export default SkillRunHistory;
