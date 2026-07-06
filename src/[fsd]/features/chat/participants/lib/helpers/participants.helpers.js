import { ChatParticipantType, DEFAULT_PARTICIPANT_NAME } from '@/common/constants';

export const getChatParticipantUniqueId = participant => {
  if (participant) {
    const entity_name =
      participant.entity_name === ChatParticipantType.Applications &&
      participant.entity_settings?.agent_type === ChatParticipantType.Pipelines
        ? ChatParticipantType.Pipelines
        : participant.entity_name;
    return (
      entity_name +
      '_' +
      (participant.entity_name === ChatParticipantType.Models
        ? participant.entity_meta?.model_name + '-' + participant.entity_meta?.integration_uid
        : participant.entity_meta?.id) +
      '_' +
      (participant.entity_meta?.project_id || '')
    );
  }
  return '';
};

export const getParticipantName = (participant, systemSenderName = DEFAULT_PARTICIPANT_NAME) => {
  switch (participant?.entity_name) {
    case ChatParticipantType.Applications:
      // Prefer entity_meta.name if present (set when adding participants),
      // otherwise fall back to meta.name
      return participant?.entity_meta?.name || participant?.meta?.name || '';
    case ChatParticipantType.Models:
      return participant?.entity_meta?.model_name || '';
    case ChatParticipantType.Users:
      return participant?.meta?.user_name || '';
    case ChatParticipantType.Pipelines:
      return participant?.entity_meta?.name || participant?.meta?.name || '';
    case ChatParticipantType.Toolkits:
      return participant?.entity_meta?.name || participant?.meta?.name || '';
    case ChatParticipantType.Skills:
      return participant?.entity_meta?.name || participant?.meta?.name || '';
    case ChatParticipantType.Dummy:
      return systemSenderName;
    default:
      return '';
  }
};

/**
 * True when a participant is a "container" agent that will NOT be bound as a callable tool in
 * adhoc chat (issue #5680): a non-pipeline application that itself uses other agents. The backend
 * sets `meta.is_container` mirroring its own skip rule; this helper is the single client-side
 * definition of "should the skip hint show for this participant" so the expanded card and the
 * collapsed section indicator can't diverge. Callers additionally gate on `!isActive` (the hint is
 * only relevant while the agent is NOT the active orchestrator). Pipelines are the sanctioned
 * deep-composition primitive and are never flagged.
 */
export const isSkippedContainerParticipant = participant => {
  if (!participant || participant.meta?.is_container !== true) return false;
  if (participant.entity_name !== ChatParticipantType.Applications) return false;
  const isPipeline =
    participant.entity_settings?.agent_type === ChatParticipantType.Pipelines ||
    participant.agent_type === ChatParticipantType.Pipelines;
  return !isPipeline;
};

export const isParticipantStillActive = participant => {
  switch (participant?.entity_name) {
    case ChatParticipantType.Applications:
      return !!participant?.meta?.name;
    case ChatParticipantType.Skills:
      return !!participant?.meta?.name;
    case ChatParticipantType.Models:
      return !!participant?.entity_meta?.model_name;
    case ChatParticipantType.Dummy:
      return true;
    default:
      return false;
  }
};
