export const resolveEntityType = item => {
  if (item.type === 'application') return item.agent_type === 'pipeline' ? 'pipeline' : 'agent';

  switch (item.type) {
    case 'skill':
      return 'skill';
    case 'mcp':
      return 'mcp';
    default:
      return 'toolkit';
  }
};
