import { describe, expect, it } from 'vitest';

import {
  collectToolReferences,
  getAttachmentRefKey,
  groupAttachmentsByKind,
} from '../pipelineToolUsage.helpers';

const getToolkitName = tool => tool.settings?.alias || tool.name;

describe('collectToolReferences', () => {
  it('collects toolkit, MCP, agent and LLM references with their tools', () => {
    const refs = collectToolReferences({
      nodes: [
        { id: 'jira_1', type: 'toolkit', toolkit_name: 'jira', tool: 'search' },
        { id: 'jira_2', type: 'toolkit', toolkit_name: 'jira', tool: 'create' },
        { id: 'mcp_1', type: 'mcp', toolkit_name: 'figma' },
        { id: 'agent_1', type: 'agent', tool: 'Reviewer' },
        { id: 'llm_1', type: 'llm', tool_names: { jira: ['comment'], github: ['read', 'write'] } },
        { id: 'code_1', type: 'code', tool: 'not a reference' },
      ],
    });

    expect([...refs.keys()].sort()).toEqual([
      'application:Reviewer',
      'toolkit:figma',
      'toolkit:github',
      'toolkit:jira',
    ]);
    expect(refs.get('toolkit:jira').nodeIds).toEqual(['jira_1', 'jira_2', 'llm_1']);
    expect([...refs.get('toolkit:jira').toolNames].sort()).toEqual(['comment', 'create', 'search']);
    expect([...refs.get('toolkit:figma').toolNames]).toEqual([]);
    expect(refs.get('application:Reviewer').nodeIds).toEqual(['agent_1']);
  });

  it('collects the loop toolkit of deprecated loop nodes', () => {
    const refs = collectToolReferences({
      nodes: [{ id: 'loop_1', type: 'loop_from_tool', loop_toolkit_name: 'jira', loop_tool: 'list' }],
    });
    expect([...refs.get('toolkit:jira').toolNames]).toEqual(['list']);
  });

  it('handles an empty or missing YAML', () => {
    expect(collectToolReferences(undefined).size).toBe(0);
    expect(collectToolReferences({ nodes: [null] }).size).toBe(0);
  });
});

describe('getAttachmentRefKey', () => {
  it('binds toolkits by toolkit name and agents by name', () => {
    const toolkit = { id: 1, type: 'jira', name: 'Jira', settings: { alias: 'jira' } };
    const named = { id: 2, type: 'github', toolkit_name: 'github', name: 'GitHub' };
    const agent = { type: 'application', name: 'Reviewer', settings: { application_id: 7 } };
    expect(getAttachmentRefKey(toolkit, getToolkitName)).toBe('toolkit:jira');
    expect(getAttachmentRefKey(named, getToolkitName)).toBe('toolkit:github');
    expect(getAttachmentRefKey(agent, getToolkitName)).toBe('application:Reviewer');
  });
});

describe('groupAttachmentsByKind', () => {
  const tools = [
    { id: 1, type: 'jira', toolkit_name: 'jira' },
    { id: 2, type: 'mcp', toolkit_name: 'figma', meta: { mcp: true } },
    { id: 3, type: 'application', name: 'Reviewer', agent_type: 'openai', settings: { application_id: 7 } },
    { id: 4, type: 'application', name: 'Sub flow', agent_type: 'pipeline', settings: { application_id: 8 } },
    { id: 5, type: 'attachments_toolkit', toolkit_name: 'attachments' },
  ];
  const refs = collectToolReferences({
    nodes: [
      { id: 'jira_1', type: 'toolkit', toolkit_name: 'jira', tool: 'search' },
      { id: 'agent_1', type: 'agent', tool: 'Reviewer' },
    ],
  });

  it('groups attachments as Toolkits, MCPs, Agents and Pipelines with the nodes using them', () => {
    const groups = groupAttachmentsByKind({ tools, refs, getToolkitName, hiddenToolIds: [5] });
    expect(groups.map(group => [group.title, group.items.map(item => [item.tool.id, item.usedBy])])).toEqual([
      ['Toolkits', [[1, ['jira_1']]]],
      ['MCPs', [[2, []]]],
      ['Agents', [[3, ['agent_1']]]],
      ['Pipelines', [[4, []]]],
    ]);
  });

  it('leaves out hidden kinds and empty groups', () => {
    const groups = groupAttachmentsByKind({
      tools: tools.slice(0, 2),
      refs,
      getToolkitName,
      hiddenKinds: ['mcp'],
    });
    expect(groups.map(group => group.title)).toEqual(['Toolkits']);
  });
});
