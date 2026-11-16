import { describe, expect, it } from 'vitest';

import { buildApplicationPickerItems, buildToolkitPickerItems } from '../pickerItems.helpers';

const getToolkitName = tool => tool.toolkit_name || tool.name;

describe('buildToolkitPickerItems', () => {
  const jira = { id: 1, type: 'jira', name: 'jira', toolkit_name: 'jira', description: 'Issues' };
  const github = { id: 2, type: 'github', name: 'github', toolkit_name: 'github' };
  const slack = { id: 3, type: 'slack', name: 'slack', toolkit_name: 'slack' };

  it('pins the toolkits the nodes use, even when they are not loaded', () => {
    const items = buildToolkitPickerItems({
      rows: [github, slack],
      attachedTools: [jira],
      usedNames: new Set(['jira']),
      getToolkitName,
    });
    expect(items.map(item => [item.name, item.inUse])).toEqual([
      ['jira', true],
      ['github', false],
      ['slack', false],
    ]);
  });

  it('lists an in-use toolkit once', () => {
    const items = buildToolkitPickerItems({
      rows: [jira, github],
      attachedTools: [jira],
      usedNames: new Set(['jira']),
      getToolkitName,
    });
    expect(items.map(item => item.id)).toEqual([1, 2]);
  });

  it('filters pinned toolkits by the search', () => {
    const items = buildToolkitPickerItems({
      rows: [],
      attachedTools: [jira],
      usedNames: new Set(['jira']),
      query: 'git',
      getToolkitName,
    });
    expect(items).toEqual([]);
  });

  it('disables a toolkit whose name another toolkit already has', () => {
    const twin = { id: 9, type: 'jira', name: 'jira', toolkit_name: 'jira' };
    const items = buildToolkitPickerItems({ rows: [jira, twin], getToolkitName });
    expect(items[0].disabledReason).toBe('');
    expect(items[1].disabledReason).toMatch(/rename/);
  });
});

describe('buildApplicationPickerItems', () => {
  const reviewer = {
    type: 'application',
    name: 'Reviewer',
    settings: { application_id: 7, application_version_id: 70 },
  };

  it('pins agents the nodes use and leaves out this pipeline', () => {
    const items = buildApplicationPickerItems({
      rows: [
        { id: 5, name: 'This pipeline' },
        { id: 7, name: 'Reviewer' },
        { id: 8, name: 'Writer' },
      ],
      attachedTools: [reviewer],
      usedNames: new Set(['Reviewer']),
      excludeId: 5,
    });
    expect(items.map(item => [item.name, item.inUse, item.isAttached])).toEqual([
      ['Reviewer', true, true],
      ['Writer', false, false],
    ]);
  });

  it('keeps swarm agents in the list, disabled with the reason', () => {
    const items = buildApplicationPickerItems({
      rows: [
        { id: 6, name: 'Swarm', has_swarm: true },
        { id: 8, name: 'Writer' },
      ],
    });
    expect(items.map(item => [item.name, Boolean(item.disabledReason)])).toEqual([
      ['Swarm', true],
      ['Writer', false],
    ]);
    expect(items[0].disabledReason).toMatch(/Swarm Mode/);
  });

  it('disables agents whose default version nests too deeply, with the reason', () => {
    const items = buildApplicationPickerItems({
      rows: [
        { id: 1, name: 'Deep', agent_subtree_tiers: 3, max_agent_nesting_tiers: 3 },
        { id: 2, name: 'Fits', agent_subtree_tiers: 2, max_agent_nesting_tiers: 3 },
        { id: 3, name: 'Unknown' },
      ],
    });
    expect(items.map(item => [item.name, Boolean(item.disabledReason)])).toEqual([
      ['Deep', true],
      ['Fits', false],
      ['Unknown', false],
    ]);
    expect(items[0].disabledReason).toMatch(/limited to 3 tiers/);
  });

  it('judges nesting against the host: a pipeline host takes a three-tier agent, an agent host does not', () => {
    const rows = [
      { id: 1, name: 'Orchestrator', agent_subtree_tiers: 3, max_agent_nesting_tiers: 3 },
      { id: 2, name: 'Too deep', agent_subtree_tiers: 4, max_agent_nesting_tiers: 3 },
    ];
    const disabled = hostTier =>
      buildApplicationPickerItems({ rows, hostTier }).map(item => [item.name, Boolean(item.disabledReason)]);

    expect(disabled(0)).toEqual([
      ['Orchestrator', false],
      ['Too deep', true],
    ]);
    expect(disabled(undefined)).toEqual([
      ['Orchestrator', true],
      ['Too deep', true],
    ]);
  });

  it('disables pipelines with interrupts', () => {
    const [item] = buildApplicationPickerItems({ rows: [{ id: 9, name: 'Flow', has_interrupt: true }] });
    expect(item.disabledReason).toMatch(/interruptions/);
  });

  it('disables an agent whose name an attached pipeline already has', () => {
    const items = buildApplicationPickerItems({
      rows: [
        { id: 7, name: 'Reviewer' },
        { id: 12, name: 'Reviewer' },
      ],
      attachedTools: [],
      allAttachedTools: [reviewer],
    });
    expect(items.map(item => [item.id, Boolean(item.disabledReason)])).toEqual([
      [7, false],
      [12, true],
    ]);
  });
});
