import { isMcpToolkit } from '@/[fsd]/shared/lib/helpers';
import { ChatParticipantType, PUBLIC_PROJECT_ID } from '@/common/constants';

import { TABS } from '../constants/chatParticipant.constants.js';

export const getEntityName = p => {
  if (p.agent_type === 'pipeline') return ChatParticipantType.Pipelines;
  if (p.participantType === ChatParticipantType.Toolkits) {
    return ChatParticipantType.Toolkits;
  }
  if (p.participantType === ChatParticipantType.Users) return ChatParticipantType.Users;
  if (p.participantType === ChatParticipantType.Skills) return ChatParticipantType.Skills;
  return ChatParticipantType.Applications;
};

export const isCatalogSkill = p =>
  p.entity_name === ChatParticipantType.Skills && p.project_id === PUBLIC_PROJECT_ID;

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
    case TABS.SKILLS:
      return fetched.filter(p => p.participantType === ChatParticipantType.Skills);
    case TABS.USERS:
      return fetched.filter(p => p.participantType === ChatParticipantType.Users);
    default:
      return fetched;
  }
};
