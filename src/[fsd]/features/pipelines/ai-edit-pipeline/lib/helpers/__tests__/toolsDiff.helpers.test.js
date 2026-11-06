import { describe, expect, it } from 'vitest';

import {
  computeInitialSelections,
  computeSummaryTools,
  getAddId,
  getRemoveId,
  normaliseCurrentTool,
  normaliseCurrentTools,
  normaliseSuggestedTools,
  toolKey,
} from '../toolsDiff.helpers';

describe('normaliseCurrentTool', () => {
  it('maps application tool to agent entityType when agent_type is not pipeline', () => {
    const tool = { type: 'application', agent_type: 'classic', settings: { application_id: 10 }, id: 99 };
    expect(normaliseCurrentTool(tool)).toMatchObject({ id: 10, entityType: 'agent' });
  });

  it('maps application tool to pipeline entityType when agent_type is pipeline', () => {
    const tool = { type: 'application', agent_type: 'pipeline', settings: { application_id: 5 }, id: 1 };
    expect(normaliseCurrentTool(tool)).toMatchObject({ id: 5, entityType: 'pipeline' });
  });

  it('falls back to id when application_id is absent', () => {
    const tool = { type: 'application', agent_type: 'classic', settings: {}, id: 42 };
    expect(normaliseCurrentTool(tool)).toMatchObject({ id: 42, entityType: 'agent' });
  });

  it('maps mcp type to mcp entityType', () => {
    const tool = { type: 'mcp', id: 7 };
    expect(normaliseCurrentTool(tool)).toMatchObject({ entityType: 'mcp' });
  });

  it('maps non-application non-mcp type to toolkit entityType', () => {
    const tool = { type: 'jira', id: 3 };
    expect(normaliseCurrentTool(tool)).toMatchObject({ entityType: 'toolkit' });
  });

  it('preserves entity_type when set on non-application tool', () => {
    const tool = { type: 'custom', entity_type: 'mcp', id: 2 };
    expect(normaliseCurrentTool(tool)).toMatchObject({ entityType: 'mcp' });
  });
});

describe('normaliseCurrentTools', () => {
  it('returns empty array for falsy input', () => {
    expect(normaliseCurrentTools(null)).toEqual([]);
    expect(normaliseCurrentTools(undefined)).toEqual([]);
  });

  it('normalises every item in the array', () => {
    const tools = [
      { type: 'jira', id: 1 },
      { type: 'application', agent_type: 'pipeline', settings: { application_id: 9 }, id: 2 },
    ];
    const result = normaliseCurrentTools(tools);
    expect(result[0].entityType).toBe('toolkit');
    expect(result[1].entityType).toBe('pipeline');
    expect(result[1].id).toBe(9);
  });
});

describe('normaliseSuggestedTools', () => {
  it('assigns entityType from each suggestion category', () => {
    const draftData = {
      suggested_toolkits: [{ id: 1 }],
      suggested_mcp: [{ id: 2 }],
      suggested_agents: [{ id: 3 }],
      suggested_pipelines: [{ id: 4 }],
      suggested_skills: [{ id: 5 }],
    };
    const result = normaliseSuggestedTools(draftData);
    expect(result).toHaveLength(5);
    expect(result.find(t => t.id === 1).entityType).toBe('toolkit');
    expect(result.find(t => t.id === 2).entityType).toBe('mcp');
    expect(result.find(t => t.id === 3).entityType).toBe('agent');
    expect(result.find(t => t.id === 4).entityType).toBe('pipeline');
    expect(result.find(t => t.id === 5).entityType).toBe('skill');
  });

  it('returns empty array for empty draft data', () => {
    expect(normaliseSuggestedTools({})).toEqual([]);
    expect(normaliseSuggestedTools(null)).toEqual([]);
  });
});

describe('toolKey', () => {
  it('produces a unique key from entityType and id', () => {
    expect(toolKey({ entityType: 'toolkit', id: 3 })).toBe('toolkit:3');
    expect(toolKey({ entityType: 'agent', id: 7 })).toBe('agent:7');
  });
});

describe('getAddId / getRemoveId', () => {
  it('returns item.id', () => {
    expect(getAddId({ id: 42, entityType: 'agent' })).toBe(42);
    expect(getRemoveId({ id: 7 })).toBe(7);
  });
});

describe('computeInitialSelections', () => {
  const currentTools = [
    { type: 'jira', id: 10 },
    { type: 'mcp', id: 20 },
    { type: 'application', agent_type: 'classic', settings: { application_id: 30 } },
    { type: 'application', agent_type: 'pipeline', settings: { application_id: 40 } },
  ];

  const draftData = {
    suggested_toolkits: [{ id: 10 }, { id: 11 }],
    suggested_mcp: [{ id: 20 }, { id: 21 }],
    suggested_agents: [{ id: 30 }, { id: 31 }],
    suggested_pipelines: [{ id: 40 }, { id: 41 }],
    suggested_skills: [{ id: 50 }, { id: 51 }],
  };

  it('pre-selects only items not already in currentTools', () => {
    const sel = computeInitialSelections(draftData, currentTools);
    expect(sel.addToolkitIds.has(10)).toBe(false);
    expect(sel.addToolkitIds.has(11)).toBe(true);
    expect(sel.addMcpIds.has(20)).toBe(false);
    expect(sel.addMcpIds.has(21)).toBe(true);
    expect(sel.addAgentIds.has(30)).toBe(false);
    expect(sel.addAgentIds.has(31)).toBe(true);
    expect(sel.addPipelineIds.has(40)).toBe(false);
    expect(sel.addPipelineIds.has(41)).toBe(true);
  });

  it('pre-selects all suggested skills', () => {
    const sel = computeInitialSelections(draftData, currentTools);
    expect(sel.addSkillIds.has(50)).toBe(true);
    expect(sel.addSkillIds.has(51)).toBe(true);
  });

  it('initialises removeToolRecordIds as empty', () => {
    const sel = computeInitialSelections(draftData, currentTools);
    expect(sel.removeToolRecordIds.size).toBe(0);
  });

  it('pre-selects everything when currentTools is empty', () => {
    const sel = computeInitialSelections(draftData, []);
    expect(sel.addToolkitIds.size).toBe(2);
    expect(sel.addMcpIds.size).toBe(2);
    expect(sel.addAgentIds.size).toBe(2);
    expect(sel.addPipelineIds.size).toBe(2);
  });

  it('handles null draftData gracefully', () => {
    const sel = computeInitialSelections(null, currentTools);
    expect(sel.addToolkitIds.size).toBe(0);
    expect(sel.addSkillIds.size).toBe(0);
  });

  it('handles null currentTools gracefully', () => {
    const sel = computeInitialSelections(draftData, null);
    expect(sel.addToolkitIds.size).toBe(2);
  });
});

describe('computeSummaryTools', () => {
  const emptySelections = {
    addToolkitIds: new Set(),
    addMcpIds: new Set(),
    addAgentIds: new Set(),
    addPipelineIds: new Set(),
    addSkillIds: new Set(),
    removeToolRecordIds: new Set(),
  };
  const currentTools = [
    { id: 1, type: 'github', name: 'GH' },
    { id: 9, type: 'application', agent_type: 'agent', name: 'Helper', settings: { application_id: 50 } },
  ];
  const draftData = {
    suggested_toolkits: [
      { id: 1, type: 'github', name: 'GH' },
      { id: 7, type: 'sharepoint', name: 'SP' },
    ],
    suggested_mcp: [{ id: 4, type: 'mcp', name: 'Github MCP' }],
  };

  it('keeps current tools and adds only selected new suggestions', () => {
    const result = computeSummaryTools(currentTools, draftData, {
      ...emptySelections,
      addMcpIds: new Set([4]),
    });
    expect(result.map(toolKey)).toEqual(['toolkit:1', 'agent:50', 'mcp:4']);
  });

  it('drops current tools marked for removal', () => {
    const result = computeSummaryTools(currentTools, draftData, {
      ...emptySelections,
      removeToolRecordIds: new Set([50]),
    });
    expect(result.map(toolKey)).toEqual(['toolkit:1']);
  });

  it('does not duplicate a suggestion that is already attached', () => {
    const result = computeSummaryTools(currentTools, draftData, {
      ...emptySelections,
      addToolkitIds: new Set([1, 7]),
    });
    expect(result.map(toolKey)).toEqual(['toolkit:1', 'agent:50', 'toolkit:7']);
  });

  it('returns an empty list when nothing is attached or selected', () => {
    expect(computeSummaryTools([], {}, emptySelections)).toEqual([]);
  });
});
