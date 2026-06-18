import { useMemo } from 'react';

import { getParticipantName } from '@/[fsd]/features/chat/participants/lib/helpers';
import { useSystemSenderName } from '@/[fsd]/shared/lib/hooks';
import { DEFAULT_PARTICIPANT_NAME } from '@/common/constants';

export const useParticipantName = participant => {
  const systemSenderName = useSystemSenderName();
  const participantName = useMemo(
    () => getParticipantName(participant, systemSenderName) || DEFAULT_PARTICIPANT_NAME,
    [participant, systemSenderName],
  );
  return participantName;
};
