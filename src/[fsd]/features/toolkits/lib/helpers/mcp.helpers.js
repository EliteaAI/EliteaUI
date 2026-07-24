import { McpConstants } from '@/[fsd]/features/toolkits/lib/constants';

export const orderMcpToolkitGroups = groups =>
  [...new Set(groups)].sort((a, b) => {
    if (a === McpConstants.MCP_OTHER_GROUP) return 1;
    if (b === McpConstants.MCP_OTHER_GROUP) return -1;
    return a.localeCompare(b, undefined, { sensitivity: 'base' });
  });
