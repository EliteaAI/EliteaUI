import { useCallback } from 'react';

import { useNavigate } from 'react-router-dom';

import { getChatParticipantUniqueId } from '@/[fsd]/features/chat/participants/lib/helpers';
import { SKILL_RUN_START_ERROR } from '@/[fsd]/features/skill/lib/constants';
import {
  buildSkillRunConversation,
  buildSkillRunParticipant,
  findSkillParticipant,
} from '@/[fsd]/features/skill/lib/helpers';
import { useToast } from '@/[fsd]/shared/lib/hooks';
import { useConversationCreateMutation } from '@/api';
import { PUBLIC_PROJECT_ID } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils';
import useLocalActiveParticipant from '@/hooks/chat/useLocalActiveParticipant';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import RouteDefinitions from '@/routes';

export const useRunCatalogSkill = () => {
  const navigate = useNavigate();
  const projectId = useSelectedProjectId();
  const { toastError } = useToast();
  const { setLocalActiveParticipant } = useLocalActiveParticipant();
  const [createConversation, { isLoading: isStartingRun }] = useConversationCreateMutation();

  const runCatalogSkill = useCallback(
    async ({ skill, versionId }) => {
      const participant = buildSkillRunParticipant({
        skillId: skill.id,
        skillName: skill.name,
        projectId: PUBLIC_PROJECT_ID,
        versionId,
        iconMeta: skill.icon_meta,
      });
      const result = await createConversation(
        buildSkillRunConversation({ projectId, skillName: skill.name, participant }),
      );
      if (!result.data) {
        toastError(buildErrorMessage(result.error) || SKILL_RUN_START_ERROR);
        return false;
      }
      const runParticipant = findSkillParticipant(result.data);
      if (runParticipant)
        setLocalActiveParticipant(result.data.id, getChatParticipantUniqueId(runParticipant));
      navigate(`${RouteDefinitions.Chat}/${result.data.id}`);
      return true;
    },
    [createConversation, navigate, projectId, setLocalActiveParticipant, toastError],
  );

  return { runCatalogSkill, isStartingRun };
};
