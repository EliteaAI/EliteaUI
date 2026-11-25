// The MCP run row (ticket #7682 AC-44, AC-45): the Event is the tool name, with the first tool and "+N" when a run
// called several tools, and a tooltip listing them all.

// The MCP run statuses (AC-45): the run outcomes without Awaiting approval, Skipped and Blocked
export const MCP_RUN_OUTCOMES = ['running', 'success', 'failed'];

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
