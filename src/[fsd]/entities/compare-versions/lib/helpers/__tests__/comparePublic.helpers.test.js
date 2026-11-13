import { describe, expect, it, vi } from 'vitest';

import {
  MAX_NESTED_DEPTH,
  NESTED_STATUS,
  buildPublicCompareKey,
  countChangedNestedAgents,
  extractAgentCompareDataForPublic,
  extractPublicAgentCompareData,
  findPublicParentApplicationId,
  getNestedAgentStatus,
  getNestedAgentTools,
  loadNestedAgents,
  matchDependencies,
  matchNestedAgents,
  resolveLinkedPublicVersionName,
} from '@/[fsd]/entities/compare-versions/lib/helpers/compareVersions.helpers';

vi.mock('@/[fsd]/entities/version', () => ({ buildVersionOption: vi.fn(), formatVersionMeta: vi.fn() }));

const PUBLIC_PROJECT_ID = 1;

const subAgentTool = (name, applicationId, versionId = applicationId * 10, extra = {}) => ({
  type: 'application',
  name,
  agent_type: 'openai',
  settings: { application_id: applicationId, application_version_id: versionId },
  ...extra,
});

const data = (overrides = {}) => ({
  instructions: 'i',
  welcome_message: 'w',
  conversation_starters: ['a'],
  tools: [],
  ...overrides,
});

const entry = (name, overrides = {}) => ({
  key: `agent:${name}`,
  name,
  entityType: 'agent',
  data: data(),
  unavailable: false,
  children: [],
  ...overrides,
});

describe('buildPublicCompareKey', () => {
  it('matches an agent or a pipeline by its name, whatever its id', () => {
    expect(buildPublicCompareKey(subAgentTool('Helper', 5))).toBe('agent:Helper');
    expect(buildPublicCompareKey(subAgentTool('Helper', 99))).toBe('agent:Helper');
    expect(buildPublicCompareKey(subAgentTool('Flow', 5, 50, { agent_type: 'pipeline' }))).toBe(
      'pipeline:Flow',
    );
  });

  it('matches a toolkit by its type and name', () => {
    expect(buildPublicCompareKey({ type: 'jira', name: 'My Jira' })).toBe('toolkit:jira:My Jira');
  });

  it('does not match an agent and a toolkit that share a name', () => {
    expect(buildPublicCompareKey(subAgentTool('Jira', 5))).not.toBe(
      buildPublicCompareKey({ type: 'jira', name: 'Jira' }),
    );
  });
});

describe('matchDependencies with a match key', () => {
  it('pairs tools by the key, not by the id, which never agrees between a fork and the public agent', () => {
    const left = [{ id: 7, entityType: 'agent', name: 'Helper', matchKey: 'agent:Helper' }];
    const right = [{ id: 900, entityType: 'agent', name: 'Helper', matchKey: 'agent:Helper' }];
    const rows = matchDependencies(left, right);
    expect(rows).toHaveLength(1);
    expect(rows[0].left).toBe(left[0]);
    expect(rows[0].right).toBe(right[0]);
  });

  it('keeps the old key for tools without one', () => {
    const rows = matchDependencies(
      [{ id: 1, entityType: 'toolkit' }],
      [
        { id: 1, entityType: 'toolkit' },
        { id: 2, entityType: 'toolkit' },
      ],
    );
    expect(rows.map(row => [Boolean(row.left), Boolean(row.right)])).toEqual([
      [true, true],
      [false, true],
    ]);
  });
});

describe('extractAgentCompareDataForPublic', () => {
  it('shapes a version of the fork and leaves its skills out', () => {
    const result = extractAgentCompareDataForPublic({
      instructions: 'x',
      welcome_message: 'hi',
      conversation_starters: ['s'],
      tools: [{ id: 3, type: 'jira', name: 'Jira' }, subAgentTool('Helper', 5)],
      skills: [{ skill_id: 1, name: 'A skill' }],
    });
    expect(result.instructions).toBe('x');
    expect(result.tools.map(tool => tool.matchKey)).toEqual(['toolkit:jira:Jira', 'agent:Helper']);
    expect(result.tools.some(tool => tool.entityType === 'skill')).toBe(false);
  });

  it('copes with a version that has nothing', () => {
    expect(extractAgentCompareDataForPublic(undefined)).toEqual({
      instructions: '',
      welcome_message: '',
      conversation_starters: [],
      tools: [],
    });
  });
});

describe('extractPublicAgentCompareData', () => {
  it('lists the sub-agents of the public version and its toolkit definitions together', () => {
    const result = extractPublicAgentCompareData({
      instructions: 'x',
      tools: [subAgentTool('Helper', 40)],
      meta: {
        fork_toolkits: [{ type: 'sharepoint', name: 'HawkSharePoint', settings: { site_path: '/x' } }],
      },
    });
    expect(result.tools.map(tool => tool.matchKey)).toEqual([
      'agent:Helper',
      'toolkit:sharepoint:HawkSharePoint',
    ]);
    expect(result.tools.map(tool => tool.entityType)).toEqual(['agent', 'toolkit']);
  });

  it('gives a sub-agent copy no id of this project, so it cannot be opened', () => {
    const [tool] = extractPublicAgentCompareData({ tools: [subAgentTool('Helper', 40)] }).tools;
    expect(tool.settings).toEqual({});
  });

  it('does not carry the credentials or settings of a toolkit definition into the view', () => {
    const [tool] = extractPublicAgentCompareData({
      meta: {
        fork_toolkits: [
          { type: 'jira', name: 'Jira', settings: { jira_configuration: { elitea_title: 'x' } } },
        ],
      },
    }).tools;
    expect(tool).not.toHaveProperty('settings.jira_configuration');
  });

  it('treats a published version without toolkit definitions as having none', () => {
    expect(extractPublicAgentCompareData({ tools: [] }).tools).toEqual([]);
    expect(extractPublicAgentCompareData({ meta: { fork_toolkits: 'broken' } }).tools).toEqual([]);
    expect(extractPublicAgentCompareData(undefined).tools).toEqual([]);
  });
});

describe('findPublicParentApplicationId', () => {
  const meta = (parentProject, parentEntity) => ({
    parent_project_id: parentProject,
    parent_entity_id: parentEntity,
  });

  it('reads the public agent from the open version', () => {
    expect(
      findPublicParentApplicationId({
        versionMeta: meta(1, 12),
        versions: [],
        publicProjectId: PUBLIC_PROJECT_ID,
      }),
    ).toBe(12);
  });

  it('accepts ids stored as text', () => {
    expect(
      findPublicParentApplicationId({
        versionMeta: meta('1', '12'),
        versions: [],
        publicProjectId: PUBLIC_PROJECT_ID,
      }),
    ).toBe(12);
  });

  it('falls back to the newest other version that records a public parent', () => {
    const versions = [
      { id: 1, meta: meta(1, 10) },
      { id: 5, meta: meta(1, 12) },
      { id: 3, meta: {} },
    ];
    expect(
      findPublicParentApplicationId({ versionMeta: {}, versions, publicProjectId: PUBLIC_PROJECT_ID }),
    ).toBe(12);
  });

  it('is null for an agent forked from a team project, or not forked at all', () => {
    expect(
      findPublicParentApplicationId({
        versionMeta: meta(6, 11),
        versions: [],
        publicProjectId: PUBLIC_PROJECT_ID,
      }),
    ).toBeNull();
    expect(
      findPublicParentApplicationId({
        versionMeta: undefined,
        versions: [{ id: 1 }],
        publicProjectId: PUBLIC_PROJECT_ID,
      }),
    ).toBeNull();
  });
});

describe('getNestedAgentTools', () => {
  it('keeps only the agents and pipelines that can be loaded', () => {
    const tools = [
      subAgentTool('A', 5),
      { type: 'jira', name: 'Jira', id: 3 },
      { type: 'application', name: 'Broken', settings: {} },
    ];
    expect(getNestedAgentTools(tools).map(tool => tool.name)).toEqual(['A']);
    expect(getNestedAgentTools(undefined)).toEqual([]);
  });
});

describe('getNestedAgentStatus', () => {
  it('is same for identical content', () => {
    expect(getNestedAgentStatus(data(), data())).toBe(NESTED_STATUS.same);
  });

  it.each([
    ['instructions', { instructions: 'other' }],
    ['welcome message', { welcome_message: 'other' }],
    ['starters', { conversation_starters: ['b'] }],
    ['tools', { tools: [{ matchKey: 'toolkit:jira:Jira' }] }],
  ])('is changed when the %s differ', (_, override) => {
    expect(getNestedAgentStatus(data(), data(override))).toBe(NESTED_STATUS.changed);
  });

  it('does not depend on the order of the tools', () => {
    const a = data({ tools: [{ matchKey: 'x' }, { matchKey: 'y' }] });
    const b = data({ tools: [{ matchKey: 'y' }, { matchKey: 'x' }] });
    expect(getNestedAgentStatus(a, b)).toBe(NESTED_STATUS.same);
  });

  it('names the side that has the sub-agent alone', () => {
    expect(getNestedAgentStatus(data(), null)).toBe(NESTED_STATUS.onlyLeft);
    expect(getNestedAgentStatus(null, data())).toBe(NESTED_STATUS.onlyRight);
  });
});

describe('matchNestedAgents', () => {
  it('pairs sub-agents by key and reports each one', () => {
    const rows = matchNestedAgents(
      [entry('Same'), entry('Edited'), entry('Mine')],
      [entry('Same'), entry('Edited', { data: data({ instructions: 'new' }) }), entry('Added')],
    );
    expect(Object.fromEntries(rows.map(row => [row.name, row.status]))).toEqual({
      Same: NESTED_STATUS.same,
      Edited: NESTED_STATUS.changed,
      Mine: NESTED_STATUS.onlyLeft,
      Added: NESTED_STATUS.onlyRight,
    });
  });

  it('never shows a sub-agent that could not be loaded as equal', () => {
    const [row] = matchNestedAgents([entry('A', { data: null, unavailable: true })], [entry('A')]);
    expect(row.status).toBe(NESTED_STATUS.changed);
    expect(row.ownStatus).toBe(NESTED_STATUS.changed);
  });

  it('still names a sub-agent that exists on one side only, even if it could not be loaded', () => {
    const [row] = matchNestedAgents([entry('A', { data: null, unavailable: true })], []);
    expect(row.status).toBe(NESTED_STATUS.onlyLeft);
  });

  it('pairs the sub-agents below a sub-agent the same way', () => {
    const [row] = matchNestedAgents(
      [entry('Parent', { children: [entry('Child')] })],
      [entry('Parent', { children: [entry('Child', { data: data({ instructions: 'new' }) })] })],
    );
    expect(row.children).toHaveLength(1);
    expect(row.children[0].status).toBe(NESTED_STATUS.changed);
  });

  it('marks a parent as changed when only a sub-agent below it differs, but keeps its own status', () => {
    const [row] = matchNestedAgents(
      [entry('Parent', { children: [entry('Child')] })],
      [entry('Parent', { children: [entry('Child', { data: data({ instructions: 'new' }) })] })],
    );
    expect(row.ownStatus).toBe(NESTED_STATUS.same);
    expect(row.status).toBe(NESTED_STATUS.changed);
  });

  it('leaves a parent as same when nothing below it differs', () => {
    const [row] = matchNestedAgents(
      [entry('Parent', { children: [entry('Child')] })],
      [entry('Parent', { children: [entry('Child')] })],
    );
    expect(row.status).toBe(NESTED_STATUS.same);
  });

  it('returns nothing when neither side has sub-agents', () => {
    expect(matchNestedAgents([], [])).toEqual([]);
    expect(matchNestedAgents(undefined, undefined)).toEqual([]);
  });
});

describe('countChangedNestedAgents', () => {
  it('counts the sub-agents that differ in themselves, at every level, without counting a parent twice', () => {
    const rows = matchNestedAgents(
      [
        entry('Unchanged'),
        entry('Parent', { children: [entry('Child'), entry('Other')] }),
        entry('OnlyMine'),
      ],
      [
        entry('Unchanged'),
        entry('Parent', {
          children: [entry('Child', { data: data({ instructions: 'new' }) }), entry('Other')],
        }),
      ],
    );
    // Child differs and OnlyMine is on one side only; Parent itself is the same, though its row reads "changed"
    expect(countChangedNestedAgents(rows)).toBe(2);
  });

  it('is zero without rows', () => {
    expect(countChangedNestedAgents([])).toBe(0);
    expect(countChangedNestedAgents(undefined)).toBe(0);
  });
});

describe('loadNestedAgents', () => {
  const treeOf = tree => async tool => {
    const found = tree[tool.settings.application_id];
    if (!found) throw new Error('not found');
    return { data: data({ instructions: found.name }), tools: found.tools };
  };

  it('loads the sub-agents of a version and theirs in turn', async () => {
    const tree = {
      5: { name: 'A', tools: [subAgentTool('B', 6)] },
      6: { name: 'B', tools: [] },
    };
    const entries = await loadNestedAgents({ tools: [subAgentTool('A', 5)], fetchChild: treeOf(tree) });
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ key: 'agent:A', unavailable: false });
    expect(entries[0].children).toHaveLength(1);
    expect(entries[0].children[0]).toMatchObject({ key: 'agent:B', unavailable: false });
  });

  it('keeps a sub-agent that cannot be loaded, as unavailable, and goes on with the others', async () => {
    const tree = { 5: { name: 'A', tools: [] } };
    const entries = await loadNestedAgents({
      tools: [subAgentTool('A', 5), subAgentTool('Missing', 9)],
      fetchChild: treeOf(tree),
    });
    expect(entries.map(item => [item.name, item.unavailable])).toEqual([
      ['A', false],
      ['Missing', true],
    ]);
    expect(entries[1].data).toBeNull();
  });

  it('stops at an agent that links back to one of its own parents', async () => {
    const tree = {
      5: { name: 'A', tools: [subAgentTool('B', 6)] },
      6: { name: 'B', tools: [subAgentTool('A', 5)] },
    };
    const entries = await loadNestedAgents({ tools: [subAgentTool('A', 5)], fetchChild: treeOf(tree) });
    const loopback = entries[0].children[0].children[0];
    expect(loopback).toMatchObject({ key: 'agent:A', unavailable: true, children: [] });
  });

  it('does not go deeper than the platform nesting limit', async () => {
    const tree = {};
    for (let id = 1; id <= MAX_NESTED_DEPTH + 3; id += 1) {
      tree[id] = { name: `L${id}`, tools: [subAgentTool(`L${id + 1}`, id + 1)] };
    }
    const fetchChild = vi.fn(treeOf(tree));
    const entries = await loadNestedAgents({ tools: [subAgentTool('L1', 1)], fetchChild });
    expect(fetchChild).toHaveBeenCalledTimes(MAX_NESTED_DEPTH);
    let deepest = entries[0];
    let levels = 1;
    while (deepest.children.length) {
      [deepest] = deepest.children;
      levels += 1;
    }
    expect(levels).toBe(MAX_NESTED_DEPTH);
  });

  it('loads nothing for a version without sub-agents', async () => {
    const fetchChild = vi.fn();
    expect(await loadNestedAgents({ tools: [{ type: 'jira', name: 'Jira' }], fetchChild })).toEqual([]);
    expect(await loadNestedAgents({ tools: undefined, fetchChild })).toEqual([]);
    expect(fetchChild).not.toHaveBeenCalled();
  });

  it('loads sibling sub-agents side by side', async () => {
    const order = [];
    const fetchChild = async tool => {
      order.push(`start:${tool.name}`);
      await Promise.resolve();
      order.push(`end:${tool.name}`);
      return { data: data(), tools: [] };
    };
    await loadNestedAgents({ tools: [subAgentTool('A', 5), subAgentTool('B', 6)], fetchChild });
    expect(order.slice(0, 2)).toEqual(['start:A', 'start:B']);
  });
});

describe('resolveLinkedPublicVersionName', () => {
  const response = (servedId, versions) => ({ version_details: { id: servedId }, versions });
  const COPY_VERSIONS = [
    { id: 11, name: 'base_subagent' },
    { id: 12, name: 'v2' },
  ];

  it('names the linked version when the endpoint served another one', () => {
    expect(resolveLinkedPublicVersionName(response(12, COPY_VERSIONS), 11)).toBe('base_subagent');
  });

  it('needs no other request when the served version is the linked one', () => {
    expect(resolveLinkedPublicVersionName(response(11, COPY_VERSIONS), 11)).toBeNull();
  });

  it('compares ids as text, as the version id is a number in one place and a string in another', () => {
    expect(resolveLinkedPublicVersionName(response('12', COPY_VERSIONS), 11)).toBe('base_subagent');
    expect(resolveLinkedPublicVersionName(response(11, COPY_VERSIONS), '11')).toBeNull();
  });

  it('keeps the served version when the link names no version the endpoint knows', () => {
    expect(resolveLinkedPublicVersionName(response(12, COPY_VERSIONS), 999)).toBeNull();
  });

  it('keeps the served version when the link carries no version at all', () => {
    expect(resolveLinkedPublicVersionName(response(12, COPY_VERSIONS), undefined)).toBeNull();
    expect(resolveLinkedPublicVersionName(response(12, COPY_VERSIONS), null)).toBeNull();
    expect(resolveLinkedPublicVersionName(response(12, COPY_VERSIONS), '')).toBeNull();
  });

  it('keeps the served version when the linked one has no name to ask for', () => {
    expect(resolveLinkedPublicVersionName(response(12, [{ id: 11 }, { id: 12, name: 'v2' }]), 11)).toBeNull();
  });

  it('copes with an answer that has no version list', () => {
    expect(resolveLinkedPublicVersionName({ version_details: { id: 1 } }, 11)).toBeNull();
    expect(resolveLinkedPublicVersionName(undefined, 11)).toBeNull();
  });
});

describe('entity type of a tool, shared by the keys and the loader', () => {
  it('reads a pipeline link as a pipeline and any other agent link as an agent', () => {
    expect(buildPublicCompareKey(subAgentTool('Flow', 5, 50, { agent_type: 'pipeline' }))).toBe(
      'pipeline:Flow',
    );
    expect(buildPublicCompareKey(subAgentTool('Helper', 5, 50, { agent_type: 'react' }))).toBe(
      'agent:Helper',
    );
    expect(buildPublicCompareKey({ type: 'application', name: 'No type' })).toBe('agent:No type');
  });

  it('gives a public toolkit definition the toolkit entity type', () => {
    const [tool] = extractPublicAgentCompareData({
      meta: { fork_toolkits: [{ type: 'jira', name: 'Jira' }] },
    }).tools;
    expect(tool.entityType).toBe('toolkit');
  });

  it('gives a public sub-agent the entity type of its link, and the loader the same one', async () => {
    const [pipeline] = extractPublicAgentCompareData({
      tools: [subAgentTool('Flow', 5, 50, { agent_type: 'pipeline' })],
    }).tools;
    expect(pipeline.entityType).toBe('pipeline');
    const [loaded] = await loadNestedAgents({
      tools: [subAgentTool('Flow', 5, 50, { agent_type: 'pipeline' })],
      fetchChild: async () => ({ data: {}, tools: [] }),
    });
    expect(loaded.entityType).toBe('pipeline');
  });
});
