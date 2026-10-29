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

  it('pins agents the nodes use and leaves out this pipeline and swarm agents', () => {
    const items = buildApplicationPickerItems({
      rows: [
        { id: 5, name: 'This pipeline' },
        { id: 6, name: 'Swarm', has_swarm: true },
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
