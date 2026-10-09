import { SKILL_RUN_MATCH, SKILL_RUN_SEARCH_PARAMS } from '@/[fsd]/features/skill/lib/constants';
import { ParticipantEntityConstants } from '@/[fsd]/shared/lib/constants';
import { ChatParticipantType } from '@/common/constants';

const { ParticipantEntityTypes } = ParticipantEntityConstants;

const NUMERIC_ID_PATTERN = /^\d+$/;

export const readRunConversationId = searchParams => {
  const requestedRunId = searchParams.get(SKILL_RUN_SEARCH_PARAMS.run);
  return NUMERIC_ID_PATTERN.test(requestedRunId ?? '') ? requestedRunId : null;
};

export const buildSkillRunName = skillName => `Run ${skillName}`;

export const buildSkillRunParticipant = ({ skillId, skillName, projectId, versionId, iconMeta }) => ({
  entity_name: ChatParticipantType.Skills,
  entity_meta: { id: skillId, project_id: projectId },
  entity_settings: versionId ? { version_id: versionId } : {},
  meta: { name: skillName, icon_meta: iconMeta || {} },
});

const buildParticipantCreatePayload = participant => ({
  entity_name: participant.entity_name,
  entity_meta: participant.entity_meta,
  entity_settings: participant.entity_settings,
});

export const buildSkillRunConversation = ({ projectId, skillName, participant }) => ({
  projectId,
  name: buildSkillRunName(skillName),
  is_private: true,
  source: ParticipantEntityTypes.Skill,
  meta: { single_participant: buildParticipantCreatePayload(participant) },
  participants: [buildParticipantCreatePayload(participant)],
});

export const findSkillParticipant = conversation =>
  conversation?.participants?.find(participant => participant.entity_name === ChatParticipantType.Skills);

export const matchSkillRun = (runParticipant, { skillId, projectId, versionId }) => {
  const isThisSkill =
    String(runParticipant?.entity_meta?.id) === String(skillId) &&
    String(runParticipant?.entity_meta?.project_id) === String(projectId);
  if (!isThisSkill) return SKILL_RUN_MATCH.otherSkill;
  const pinnedVersionId = runParticipant.entity_settings?.version_id;
  return pinnedVersionId && String(pinnedVersionId) !== String(versionId)
    ? SKILL_RUN_MATCH.otherVersion
    : SKILL_RUN_MATCH.sameVersion;
};
