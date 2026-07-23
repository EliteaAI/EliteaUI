export const McpCategory = {
  Local: 'Local',
  Remote: 'Remote',
};

export const McpToolkitGroup = {
  Elitea: 'Elitea',
  EPAM: 'EPAM',
  Other: 'Other',
};

export const orderMcpToolkitGroups = groups =>
  [...new Set(groups)].sort((a, b) => {
    if (a === McpToolkitGroup.Other) return 1;
    if (b === McpToolkitGroup.Other) return -1;
    return a.localeCompare(b, undefined, { sensitivity: 'base' });
  });
