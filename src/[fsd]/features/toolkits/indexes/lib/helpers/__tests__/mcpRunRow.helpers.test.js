import { describe, expect, it } from 'vitest';

import { MCP_RUN_OUTCOMES, decorateMcpRow, toMcpEventLabel, toMcpEventTooltip } from '../mcpRunRow.helpers';

describe('MCP run row Event', () => {
  it('shows the one tool name of a run', () => {
    expect(toMcpEventLabel(['resolve-library-id'])).toBe('resolve-library-id');
  });

  it('shows the first tool and +N for a run that called several (AC-44)', () => {
    expect(toMcpEventLabel(['query-docs', 'resolve-library-id', 'get-docs'])).toBe('query-docs +2');
  });

  it('lists every tool in the tooltip', () => {
    expect(toMcpEventTooltip(['query-docs', 'get-docs'])).toBe('query-docs, get-docs');
  });

  it('shows a hyphen for a run with no tool call', () => {
    expect(toMcpEventLabel([])).toBe('-');
    expect(toMcpEventLabel(undefined)).toBe('-');
  });

  it('decorates a row with its Event label and tooltip', () => {
    const row = decorateMcpRow({ id: 1, tool_names: ['query-docs', 'get-docs'] });
    expect(row.event_label).toBe('query-docs +1');
    expect(row.event_tooltip).toBe('query-docs, get-docs');
  });

  it('offers only the MCP statuses (AC-45)', () => {
    expect(MCP_RUN_OUTCOMES).toEqual(['running', 'success', 'failed']);
  });
});
