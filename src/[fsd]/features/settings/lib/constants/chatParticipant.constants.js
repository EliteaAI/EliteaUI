import { ChatParticipantType } from '@/common/constants';

export const TABS = {
  AGENTS: 'agents',
  PIPELINES: 'pipelines',
  TOOLKITS: 'toolkits',
  MCPS: 'mcps',
  USERS: 'users',
};

export const TAB_LABELS = {
  [TABS.AGENTS]: 'Agents',
  [TABS.PIPELINES]: 'Pipelines',
  [TABS.TOOLKITS]: 'Toolkits',
  [TABS.MCPS]: 'MCPs',
  [TABS.USERS]: 'Users',
};

export const ENTITY_TYPE_LABEL = {
  [ChatParticipantType.Applications]: 'Agent',
  [ChatParticipantType.Pipelines]: 'Pipeline',
  [ChatParticipantType.Toolkits]: 'Toolkit',
  mcp: 'MCP',
  [ChatParticipantType.Users]: 'User',
};

export const TAB_ENTITY_TYPE = {
  [TABS.AGENTS]: ChatParticipantType.Applications,
  [TABS.PIPELINES]: ChatParticipantType.Pipelines,
  [TABS.TOOLKITS]: ChatParticipantType.Toolkits,
  [TABS.MCPS]: 'mcp',
  [TABS.USERS]: ChatParticipantType.Users,
};

export const TAB_FETCH_TYPES = {
  [TABS.AGENTS]: [ChatParticipantType.Applications],
  [TABS.PIPELINES]: [ChatParticipantType.Applications],
  [TABS.TOOLKITS]: [ChatParticipantType.Toolkits],
  [TABS.MCPS]: [ChatParticipantType.Toolkits],
  [TABS.USERS]: [ChatParticipantType.Users],
};

export const TAB_ROW_OPTION = '__tab_row__';
export const EMPTY_SENTINEL = '__no_results__';

export const TAB_ROW_ITEM_STYLE = {
  padding: 0,
  cursor: 'default',
  minHeight: 'auto',
  '&:hover': { backgroundColor: 'transparent' },
  '&.Mui-disabled': { opacity: 1, pointerEvents: 'all' },
};
