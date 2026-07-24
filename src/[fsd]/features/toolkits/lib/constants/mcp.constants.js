export const McpCategory = {
  Local: 'Local',
  Remote: 'Remote',
};

export const MCP_OTHER_GROUP = 'Other';

export const orderMcpToolkitGroups = groups =>
  [...new Set(groups)].sort((a, b) => {
    if (a === MCP_OTHER_GROUP) return 1;
    if (b === MCP_OTHER_GROUP) return -1;
    return a.localeCompare(b, undefined, { sensitivity: 'base' });
  });
