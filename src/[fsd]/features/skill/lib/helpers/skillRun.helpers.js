import { ParticipantEntityConstants } from '@/[fsd]/shared/lib/constants';
import { ChatParticipantType } from '@/common/constants';

export const SKILL_RUN_SOURCE = ParticipantEntityConstants.ParticipantEntityTypes.Skill;

export const buildSkillRunParticipant = ({ skillId, skillName, projectId, versionId, iconMeta }) => ({
  entity_name: ChatParticipantType.Skills,
  entity_meta: { id: skillId, project_id: projectId },
  entity_settings: versionId ? { version_id: versionId } : {},
  meta: { name: skillName, icon_meta: iconMeta || {} },
});

const toCreatePayload = participant => ({
  entity_name: participant.entity_name,
  entity_meta: participant.entity_meta,
  entity_settings: participant.entity_settings,
});

export const buildSkillRunConversation = ({ projectId, skillName, participant }) => ({
  projectId,
  name: `Run ${skillName}`,
  is_private: true,
  source: SKILL_RUN_SOURCE,
  meta: { single_participant: toCreatePayload(participant) },
  participants: [toCreatePayload(participant)],
});

export const findSkillParticipant = conversation =>
  conversation?.participants?.find(participant => participant.entity_name === ChatParticipantType.Skills);

export const SKILL_RUN_MATCH = {
  sameVersion: 'sameVersion',
  otherVersion: 'otherVersion',
  otherSkill: 'otherSkill',
};

// A run always executes its pinned version, so the page must show that version before reopening it
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
