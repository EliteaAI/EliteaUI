// An MCP in the chat: a toolkit participant flagged by its meta or by its toolkit type
export const isMcpParticipant = p => !!(p?.meta?.mcp || p?.entity_settings?.toolkit_type === 'mcp');
