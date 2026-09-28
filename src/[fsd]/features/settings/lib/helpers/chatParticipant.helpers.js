import { isMcpToolkit } from '@/[fsd]/shared/lib/helpers';
import { ChatParticipantType } from '@/common/constants';

import { TABS } from '../constants/chatParticipant.constants.js';

export const getEntityName = p => {
  if (p.agent_type === 'pipeline') return ChatParticipantType.Pipelines;
  if (p.participantType === ChatParticipantType.Toolkits) {
    return ChatParticipantType.Toolkits;
  }
  if (p.participantType === ChatParticipantType.Users) return ChatParticipantType.Users;
  return ChatParticipantType.Applications;
};

export const filterFetchedForTab = (fetched, tab) => {
  switch (tab) {
    case TABS.AGENTS:
      return fetched.filter(
        p => p.participantType === ChatParticipantType.Applications && p.agent_type !== 'pipeline',
      );
    case TABS.PIPELINES:
      return fetched.filter(p => p.agent_type === 'pipeline');
    case TABS.TOOLKITS:
      return fetched.filter(p => p.participantType === ChatParticipantType.Toolkits && !isMcpToolkit(p));
    case TABS.MCPS:
      return fetched.filter(p => p.participantType === ChatParticipantType.Toolkits && isMcpToolkit(p));
    case TABS.USERS:
      return fetched.filter(p => p.participantType === ChatParticipantType.Users);
    default:
      return fetched;
  }
};
