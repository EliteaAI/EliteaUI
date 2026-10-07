import { useCallback } from 'react';

import { useNavigate } from 'react-router-dom';

import { getChatParticipantUniqueId } from '@/[fsd]/features/chat/participants/lib/helpers';
import {
  buildSkillRunConversation,
  buildSkillRunParticipant,
  findSkillParticipant,
} from '@/[fsd]/features/skill/lib/helpers/skillRun.helpers';
import { useConversationCreateMutation } from '@/api';
import { PUBLIC_PROJECT_ID } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils';
import useLocalActiveParticipant from '@/hooks/chat/useLocalActiveParticipant';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';
import RouteDefinitions from '@/routes';

/**
 * A Catalog skill runs as a private chat in the user's current project, so the history and the bill
 * stay with that project while the participant points at the published skill.
 */
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
        toastError(buildErrorMessage(result.error) || 'Failed to start the skill run');
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
