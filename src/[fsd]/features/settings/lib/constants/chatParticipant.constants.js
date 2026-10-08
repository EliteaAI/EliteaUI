import { ChatParticipantType } from '@/common/constants';

export const TABS = {
  AGENTS: 'agents',
  PIPELINES: 'pipelines',
  TOOLKITS: 'toolkits',
  MCPS: 'mcps',
  SKILLS: 'skills',
  USERS: 'users',
};

export const TAB_LABELS = {
  [TABS.AGENTS]: 'Agents',
  [TABS.PIPELINES]: 'Pipelines',
  [TABS.TOOLKITS]: 'Toolkits',
  [TABS.MCPS]: 'MCPs',
  [TABS.SKILLS]: 'Skills',
  [TABS.USERS]: 'Users',
};

export const TAB_FETCH_TYPES = {
  [TABS.AGENTS]: [ChatParticipantType.Applications],
  [TABS.PIPELINES]: [ChatParticipantType.Pipelines],
  [TABS.TOOLKITS]: [ChatParticipantType.Toolkits],
  [TABS.MCPS]: [ChatParticipantType.Toolkits],
  [TABS.SKILLS]: [ChatParticipantType.Skills],
  [TABS.USERS]: [ChatParticipantType.Users],
};
