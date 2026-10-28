import { describe, expect, it } from 'vitest';

import { reconcileAttachments } from '../attachmentReconcile.helpers';

const getToolkitName = tool => tool.name;

const jira = {
  id: 1,
  type: 'jira',
  name: 'jira',
  toolkit_name: 'jira',
  settings: {
    selected_tools: ['search', 'create', 'comment'],
    available_tools: ['search', 'create', 'comment'],
  },
};
const github = {
  id: 2,
  type: 'github',
  name: 'github',
  toolkit_name: 'github',
  settings: { selected_tools: [] },
};
const legacy = {
  id: 3,
  type: 'slack',
  name: 'slack',
  toolkit_name: 'slack',
  settings: { selected_tools: ['post'] },
};
const reviewer = {
  id: 9,
  type: 'application',
  name: 'Reviewer',
  settings: { application_id: 7, application_version_id: 70 },
};

const toolkitNode = (id, toolkitName, tool) => ({ id, type: 'toolkit', toolkit_name: toolkitName, tool });
const yaml = (...nodes) => ({ nodes });

const reconcile = ({ tools, initialTools = tools, yamlJsonObject, initialYamlJsonObject }) =>
  reconcileAttachments({ tools, initialTools, yamlJsonObject, initialYamlJsonObject, getToolkitName });

describe('reconcileAttachments', () => {
  it('changes nothing when the nodes are as loaded (a no-op Save sends nothing)', () => {
    const initialYaml = yaml(toolkitNode('jira_1', 'jira', 'search'), {
      id: 'a',
      type: 'agent',
      tool: 'Reviewer',
    });
    const tools = [jira, legacy, reviewer];
    expect(reconcile({ tools, yamlJsonObject: initialYaml, initialYamlJsonObject: initialYaml })).toBe(tools);
  });

  it('keeps legacy attachments that no node ever used', () => {
    const tools = [legacy];
    expect(reconcile({ tools, yamlJsonObject: yaml(), initialYamlJsonObject: yaml() })).toBe(tools);
  });

  it('drops an attachment once its last node is gone', () => {
    const initialYaml = yaml(
      toolkitNode('jira_1', 'jira', 'search'),
      toolkitNode('jira_2', 'jira', 'search'),
    );
    const tools = [jira];

    expect(
      reconcile({
        tools,
        yamlJsonObject: yaml(toolkitNode('jira_2', 'jira', 'search')),
        initialYamlJsonObject: initialYaml,
      }),
    ).toBe(tools);
    expect(reconcile({ tools, yamlJsonObject: yaml(), initialYamlJsonObject: initialYaml })).toEqual([]);
  });

  it('drops an attachment added in this session when its node is removed', () => {
    const next = reconcile({
      tools: [github],
      initialTools: [],
      yamlJsonObject: yaml(),
      initialYamlJsonObject: yaml(),
    });
    expect(next).toEqual([]);
  });

  it('drops an agent when no node uses it any more', () => {
    const initialYaml = yaml({ id: 'a', type: 'agent', tool: 'Reviewer' });
    expect(
      reconcile({
        tools: [reviewer],
        yamlJsonObject: yaml({ id: 'a', type: 'agent' }),
        initialYamlJsonObject: initialYaml,
      }),
    ).toEqual([]);
  });

  it('narrows selected tools to the union of the tools its nodes use, LLM nodes included', () => {
    const initialYaml = yaml(toolkitNode('jira_1', 'jira', 'search'));
    const [next] = reconcile({
      tools: [jira],
      yamlJsonObject: yaml(toolkitNode('jira_1', 'jira', 'create'), {
        id: 'llm',
        type: 'llm',
        tool_names: { jira: ['comment'] },
      }),
      initialYamlJsonObject: initialYaml,
    });
    expect(next.settings.selected_tools).toEqual(['comment', 'create']);
    expect(next.settings.available_tools).toEqual(jira.settings.available_tools);
  });

  it('restores the saved selected tools when the usage goes back to what was loaded', () => {
    const initialYaml = yaml(toolkitNode('jira_1', 'jira', 'search'));
    const edited = { ...jira, settings: { ...jira.settings, selected_tools: ['create'] } };
    const [next] = reconcile({
      tools: [edited],
      initialTools: [jira],
      yamlJsonObject: initialYaml,
      initialYamlJsonObject: initialYaml,
    });
    expect(next.settings.selected_tools).toEqual(jira.settings.selected_tools);
  });

  it('is idempotent', () => {
    const args = {
      tools: [jira, github],
      initialTools: [jira],
      yamlJsonObject: yaml(toolkitNode('jira_1', 'jira', 'create'), toolkitNode('gh', 'github', 'read')),
      initialYamlJsonObject: yaml(toolkitNode('jira_1', 'jira', 'search')),
    };
    const once = reconcile(args);
    expect(reconcile({ ...args, tools: once })).toBe(once);
  });
});
