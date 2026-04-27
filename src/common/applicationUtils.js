export default function clearTools(tools = [], currentUserId = null) {
  return tools.map(tool => {
    const { settings } = tool;
    const { integration_user_id } = settings;
    return {
      ...tool,
      author_id: currentUserId || undefined,
      settings: {
        ...settings,
        integration_user_id: integration_user_id ?? undefined,
      },
    };
  });
}
