// The Event of an MCP run is its first tool, with "+N" for the rest and a tooltip listing them all
export const toMcpEventLabel = toolNames => {
  if (!toolNames?.length) return '-';
  return toolNames.length > 1 ? `${toolNames[0]} +${toolNames.length - 1}` : toolNames[0];
};

export const toMcpEventTooltip = toolNames => (toolNames?.length ? toolNames.join(', ') : '');

export const decorateMcpRow = row => ({
  ...row,
  event_label: toMcpEventLabel(row.tool_names),
  event_tooltip: toMcpEventTooltip(row.tool_names),
});
