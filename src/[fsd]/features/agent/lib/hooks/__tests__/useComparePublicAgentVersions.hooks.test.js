// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { cleanup, renderHook } from '@testing-library/react';

const { mocks } = vi.hoisted(() => ({
  mocks: {
    fetchLocal: vi.fn(),
    fetchPublic: vi.fn(),
    publicQuery: { data: undefined, error: undefined, isFetching: false },
    publicQueryArgs: [],
  },
}));

vi.mock('@/api/applications', () => ({
  useLazyGetApplicationVersionDetailQuery: () => [mocks.fetchLocal],
  useLazyPublicApplicationDetailsQuery: () => [mocks.fetchPublic],
  usePublicApplicationDetailsQuery: (args, options) => {
    mocks.publicQueryArgs.push({ args, options });
    return mocks.publicQuery;
  },
}));
vi.mock('@/common/constants', () => ({
  CollectionStatus: { Published: 'published' },
  PUBLIC_PROJECT_ID: 1,
}));
vi.mock('@/[fsd]/entities/compare-versions', async () => {
  const helpers = await import('@/[fsd]/entities/compare-versions/lib/helpers/compareVersions.helpers');
  const constants = await import('@/[fsd]/entities/compare-versions/lib/constants/compareVersions.constants');
  return {
    COMPARE_MESSAGES: constants.COMPARE_MESSAGES,
    resolveLinkedPublicVersionName: helpers.resolveLinkedPublicVersionName,
    extractAgentCompareDataForPublic: helpers.extractAgentCompareDataForPublic,
    extractPublicAgentCompareData: helpers.extractPublicAgentCompareData,
    findPublicParentApplicationId: helpers.findPublicParentApplicationId,
    loadNestedAgents: helpers.loadNestedAgents,
    matchNestedAgents: helpers.matchNestedAgents,
  };
});
vi.mock('@/[fsd]/entities/version', () => ({ buildVersionOption: vi.fn(), formatVersionMeta: vi.fn() }));

const { useComparePublicAgentVersions } = await import('../useComparePublicAgentVersions.hooks');

const unwrapping = value => ({
  unwrap: () => (value instanceof Error ? Promise.reject(value) : Promise.resolve(value)),
});

const subAgent = (name, applicationId, versionId = applicationId * 10) => ({
  type: 'application',
  name,
  agent_type: 'openai',
  settings: { application_id: applicationId, application_version_id: versionId },
});

const PUBLIC_VERSIONS = [
  { id: 501, name: 'v1', status: 'published', created_at: '2026-03-01' },
  { id: 502, name: 'v2', status: 'published', created_at: '2026-04-01' },
  { id: 900, name: 'base_subagent', status: 'embedded', created_at: '2026-04-01' },
];

const MINE = {
  id: 20,
  name: 'v2',
  instructions: 'my instructions',
  welcome_message: 'hi',
  conversation_starters: ['a'],
  tools: [{ id: 3, type: 'jira', name: 'Jira' }, subAgent('Helper', 7)],
};

const PUBLIC_V2 = {
  version_details: {
    id: 502,
    name: 'v2',
    instructions: 'public instructions',
    welcome_message: 'hello',
    conversation_starters: [],
    tools: [subAgent('Helper', 40)],
    meta: { fork_toolkits: [{ type: 'jira', name: 'Jira' }] },
  },
};

// What the public endpoint answers for a copy of a sub-agent: the version it serves, and every version it holds
const publicCopy = (served, others = []) => ({
  version_details: { tools: [], ...served },
  versions: [served, ...others].map(({ id, name }) => ({ id, name, status: 'embedded' })),
});

const setup = (overrides = {}) =>
  renderHook(() =>
    useComparePublicAgentVersions({
      projectId: 3,
      applicationId: 4,
      versionMeta: { parent_project_id: 1, parent_entity_id: 12 },
      versions: [],
      open: true,
      ...overrides,
    }),
  );

describe('useComparePublicAgentVersions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.publicQueryArgs.length = 0;
    mocks.publicQuery = { data: { versions: PUBLIC_VERSIONS }, error: undefined, isFetching: false };
    mocks.fetchLocal.mockImplementation(({ versionId }) =>
      unwrapping(
        versionId === 20 ? MINE : { id: versionId, name: 'child', instructions: 'local child', tools: [] },
      ),
    );
    mocks.fetchPublic.mockImplementation(({ applicationId, versionName }) =>
      unwrapping(
        applicationId === 12
          ? versionName === 'v2'
            ? PUBLIC_V2
            : { version_details: { ...PUBLIC_V2.version_details, id: 501, name: 'v1' } }
          : publicCopy({ id: 901, name: 'base_subagent', instructions: 'public child' }),
      ),
    );
  });
  afterEach(() => cleanup());

  describe('which public agent', () => {
    it('is the one the open version was forked from', () => {
      expect(setup().result.current.publicApplicationId).toBe(12);
    });

    it('falls back to another version of the agent that records the parent', () => {
      const { result } = setup({
        versionMeta: {},
        versions: [{ id: 5, meta: { parent_project_id: 1, parent_entity_id: 33 } }],
      });
      expect(result.current.publicApplicationId).toBe(33);
    });

    it('is none for an agent forked from a team project', () => {
      const { result } = setup({ versionMeta: { parent_project_id: 6, parent_entity_id: 11 } });
      expect(result.current.publicApplicationId).toBeNull();
    });
  });

  describe('the public versions', () => {
    it('are requested only while the dialog is open, and only for a forked agent', () => {
      setup({ open: false });
      expect(mocks.publicQueryArgs.at(-1).options.skip).toBe(true);
      setup({ versionMeta: {} });
      expect(mocks.publicQueryArgs.at(-1).options.skip).toBe(true);
      setup();
      expect(mocks.publicQueryArgs.at(-1)).toEqual({ args: { applicationId: 12 }, options: { skip: false } });
    });

    it('offer only the versions published to the catalog, not the copies of sub-agents', () => {
      expect(setup().result.current.publicVersions.map(version => version.id)).toEqual([501, 502]);
    });

    it('pass on the loading state, and the message of the compare dialog for an error', () => {
      mocks.publicQuery = { data: undefined, error: { status: 500 }, isFetching: true };
      const { result } = setup();
      expect(result.current.isLoadingPublicVersions).toBe(true);
      expect(result.current.publicLoadError).toBe('Failed to load the public versions. Please try again.');
    });

    it('are empty when the public agent returns none', () => {
      mocks.publicQuery = { data: { versions: [] }, error: undefined, isFetching: false };
      expect(setup().result.current.publicVersions).toEqual([]);
    });
  });

  describe('loading a comparison', () => {
    it('reads the chosen version of the agent and the chosen public version by name', async () => {
      const { result } = setup();
      await result.current.loadVersions(20, 502);
      expect(mocks.fetchLocal).toHaveBeenCalledWith({ projectId: 3, applicationId: 4, versionId: 20 }, true);
      expect(mocks.fetchPublic).toHaveBeenCalledWith({ applicationId: 12, versionName: 'v2' }, true);
    });

    it('compares another public version when asked to', async () => {
      const { result } = setup();
      await result.current.loadVersions(20, 501);
      expect(mocks.fetchPublic).toHaveBeenCalledWith({ applicationId: 12, versionName: 'v1' }, true);
    });

    it('returns both sides in the shape the wizard reads, without skills', async () => {
      const { result } = setup();
      const loaded = await result.current.loadVersions(20, 502);
      expect(loaded.leftData.instructions).toBe('my instructions');
      expect(loaded.rightData.instructions).toBe('public instructions');
      expect(loaded.leftVersionMeta).toMatchObject({ id: 20, name: 'v2' });
      expect(loaded.rightVersionMeta).toMatchObject({ id: 502, name: 'v2' });
    });

    it('matches the tools of both sides by name, and shows the public toolkits kept in the meta', async () => {
      const { result } = setup();
      const loaded = await result.current.loadVersions(20, 502);
      expect(loaded.leftData.tools.map(tool => tool.matchKey)).toEqual(['toolkit:jira:Jira', 'agent:Helper']);
      expect(loaded.rightData.tools.map(tool => tool.matchKey)).toEqual([
        'agent:Helper',
        'toolkit:jira:Jira',
      ]);
    });

    it('fails for a public version that is not on offer', async () => {
      const { result } = setup();
      await expect(result.current.loadVersions(20, 900)).rejects.toThrow('not available');
      expect(mocks.fetchLocal).not.toHaveBeenCalled();
    });

    it('fails when the version of the agent cannot be read', async () => {
      mocks.fetchLocal.mockImplementation(() => unwrapping(new Error('gone')));
      const { result } = setup();
      await expect(result.current.loadVersions(20, 502)).rejects.toThrow('gone');
    });

    it('fails when the public version cannot be read', async () => {
      mocks.fetchPublic.mockImplementation(() => unwrapping(new Error('forbidden')));
      const { result } = setup();
      await expect(result.current.loadVersions(20, 502)).rejects.toThrow('forbidden');
    });
  });

  describe('the sub-agents', () => {
    it('are read from this project on your side, and from the public project on the public side', async () => {
      const { result } = setup();
      await result.current.loadVersions(20, 502);
      expect(mocks.fetchLocal).toHaveBeenCalledWith({ projectId: 3, applicationId: 7, versionId: 70 }, true);
      expect(mocks.fetchPublic).toHaveBeenCalledWith({ applicationId: 40 }, true);
    });

    it('are paired by name even though their ids never agree', async () => {
      const { result } = setup();
      const { nestedRows } = await result.current.loadVersions(20, 502);
      expect(nestedRows).toHaveLength(1);
      expect(nestedRows[0]).toMatchObject({ key: 'agent:Helper', status: 'changed' });
      expect(nestedRows[0].left.data.instructions).toBe('local child');
      expect(nestedRows[0].right.data.instructions).toBe('public child');
    });

    describe('which version of a public sub-agent copy', () => {
      // The copy has two versions; the public version links to the older one, the endpoint serves the newer one
      const answerFor = ({ servedId = 902, linkedVersions }) =>
        mocks.fetchPublic.mockImplementation(({ applicationId, versionName }) => {
          if (applicationId === 12) return unwrapping(versionName === 'v2' ? PUBLIC_V2 : {});
          if (versionName === 'base_subagent') {
            return unwrapping(publicCopy({ id: 901, name: 'base_subagent', instructions: 'linked version' }));
          }
          return unwrapping(
            publicCopy({ id: servedId, name: 'v2', instructions: 'newest version' }, linkedVersions),
          );
        });

      const withLink = versionId => {
        PUBLIC_V2.version_details.tools = [subAgent('Helper', 40, versionId)];
      };

      afterEach(() => {
        PUBLIC_V2.version_details.tools = [subAgent('Helper', 40)];
      });

      it('reads the version the public version links to, not the default one', async () => {
        withLink(901);
        answerFor({ linkedVersions: [{ id: 901, name: 'base_subagent' }] });
        const { result } = setup();
        const { nestedRows } = await result.current.loadVersions(20, 502);
        expect(mocks.fetchPublic).toHaveBeenCalledWith({ applicationId: 40 }, true);
        expect(mocks.fetchPublic).toHaveBeenCalledWith(
          { applicationId: 40, versionName: 'base_subagent' },
          true,
        );
        expect(nestedRows[0].right.data.instructions).toBe('linked version');
      });

      it('asks only once when the endpoint already served the linked version', async () => {
        withLink(902);
        answerFor({ linkedVersions: [{ id: 901, name: 'base_subagent' }] });
        const { result } = setup();
        const { nestedRows } = await result.current.loadVersions(20, 502);
        const asked = mocks.fetchPublic.mock.calls.filter(([args]) => args.applicationId === 40);
        expect(asked).toHaveLength(1);
        expect(nestedRows[0].right.data.instructions).toBe('newest version');
      });

      it('falls back to the served version when the link names none the copy holds', async () => {
        withLink(555);
        answerFor({ linkedVersions: [{ id: 901, name: 'base_subagent' }] });
        const { result } = setup();
        const { nestedRows } = await result.current.loadVersions(20, 502);
        const asked = mocks.fetchPublic.mock.calls.filter(([args]) => args.applicationId === 40);
        expect(asked).toHaveLength(1);
        expect(nestedRows[0].right.data.instructions).toBe('newest version');
        expect(nestedRows[0].right.unavailable).toBe(false);
      });

      it('shows the sub-agent as unavailable when the linked version cannot be read', async () => {
        withLink(901);
        mocks.fetchPublic.mockImplementation(({ applicationId, versionName }) => {
          if (applicationId === 12) return unwrapping(versionName === 'v2' ? PUBLIC_V2 : {});
          if (versionName === 'base_subagent') return unwrapping(new Error('gone'));
          return unwrapping(publicCopy({ id: 902, name: 'v2' }, [{ id: 901, name: 'base_subagent' }]));
        });
        const { result } = setup();
        const { nestedRows } = await result.current.loadVersions(20, 502);
        expect(nestedRows[0].right.unavailable).toBe(true);
      });
    });

    it('go further down when a sub-agent has sub-agents of its own', async () => {
      mocks.fetchLocal.mockImplementation(({ versionId }) =>
        unwrapping(
          versionId === 20
            ? MINE
            : versionId === 70
              ? { id: 70, name: 'child', instructions: 'x', tools: [subAgent('Grandchild', 8)] }
              : { id: versionId, name: 'grand', instructions: 'deep', tools: [] },
        ),
      );
      const { result } = setup();
      const { nestedRows } = await result.current.loadVersions(20, 502);
      expect(nestedRows[0].children.map(child => child.key)).toEqual(['agent:Grandchild']);
      expect(nestedRows[0].children[0].status).toBe('only-left');
    });

    it('keep the rest of the comparison when one of them cannot be read', async () => {
      mocks.fetchPublic.mockImplementation(({ applicationId, versionName }) =>
        applicationId === 40
          ? unwrapping(new Error('not visible'))
          : unwrapping(applicationId === 12 && versionName ? PUBLIC_V2 : {}),
      );
      const { result } = setup();
      const loaded = await result.current.loadVersions(20, 502);
      expect(loaded.rightData.instructions).toBe('public instructions');
      expect(loaded.nestedRows[0].right.unavailable).toBe(true);
      expect(loaded.nestedRows[0].status).toBe('changed');
    });

    it('are none when neither version has any', async () => {
      mocks.fetchLocal.mockImplementation(() =>
        unwrapping({ ...MINE, tools: [{ id: 3, type: 'jira', name: 'Jira' }] }),
      );
      mocks.fetchPublic.mockImplementation(() =>
        unwrapping({ version_details: { ...PUBLIC_V2.version_details, tools: [] } }),
      );
      const { result } = setup();
      expect((await result.current.loadVersions(20, 502)).nestedRows).toEqual([]);
    });
  });

  it('never writes anything', async () => {
    const { result } = setup();
    await result.current.loadVersions(20, 502);
    expect(Object.keys(result.current)).not.toEqual(expect.arrayContaining(['onSaveLeft', 'onSaveRight']));
  });
});
