import { useMemo } from 'react';

import { useSystemSenderName } from '@/[fsd]/shared/lib/hooks';
import { ChatParticipantType, DEFAULT_PARTICIPANT_NAME } from '@/common/constants';

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

export default function useParticipantName(participant) {
  const systemSenderName = useSystemSenderName();
  const participantName = useMemo(
    () => getParticipantName(participant, systemSenderName) || DEFAULT_PARTICIPANT_NAME,
    [participant, systemSenderName],
  );
  return participantName;
}
