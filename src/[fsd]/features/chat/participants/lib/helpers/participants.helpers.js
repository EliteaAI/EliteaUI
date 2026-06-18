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
    case ChatParticipantType.Datasources:
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
    case ChatParticipantType.Dummy:
      return systemSenderName;
    default:
      return '';
  }
};

export const isParticipantStillActive = participant => {
  switch (participant?.entity_name) {
    case ChatParticipantType.Applications:
    case ChatParticipantType.Datasources:
      return !!participant?.meta?.name;
    case ChatParticipantType.Models:
      return !!participant?.entity_meta?.model_name;
    case ChatParticipantType.Dummy:
      return true;
    default:
      return false;
  }
};
