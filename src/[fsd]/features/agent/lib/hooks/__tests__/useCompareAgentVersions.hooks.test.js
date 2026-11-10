// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { act, cleanup, renderHook } from '@testing-library/react';

const { mocks } = vi.hoisted(() => ({
  mocks: {
    fetchVersion: vi.fn(),
    updateVersion: vi.fn(),
    fetchSkills: vi.fn(),
    dispatch: vi.fn(),
    updateQueryData: vi.fn((endpoint, args, recipe) => ({ type: 'patch', endpoint, args, recipe })),
    toastSuccess: vi.fn(),
    toastError: vi.fn(),
    rebuild: vi.fn(() => ({ nodes: [{ id: 'rebuilt' }], edges: [] })),
  },
}));

vi.mock('react-redux', () => ({ useDispatch: () => mocks.dispatch }));
vi.mock('@/api/applications', () => ({
  useLazyGetApplicationVersionDetailQuery: () => [mocks.fetchVersion],
  useUpdateApplicationVersionMutation: () => [mocks.updateVersion],
}));
vi.mock('@/[fsd]/features/skill/api', () => ({
  useLazyGetApplicationSkillsQuery: () => [mocks.fetchSkills],
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useToast: () => ({ toastSuccess: mocks.toastSuccess, toastError: mocks.toastError }),
}));
vi.mock('@/api/eliteaApi', () => ({ eliteaApi: { util: { updateQueryData: mocks.updateQueryData } } }));
vi.mock('@/[fsd]/features/pipelines/lib/helpers/pipelineCanvasSync.helpers', () => ({
  rebuildPipelineSettingsFromYaml: mocks.rebuild,
}));
vi.mock('@/[fsd]/entities/compare-versions', async () => {
  const constants = await import('@/[fsd]/entities/compare-versions/lib/constants/compareVersions.constants');
  const helpers = await import('@/[fsd]/entities/compare-versions/lib/helpers/compareVersions.helpers');
  return {
    COMPARE_ENTITY_TYPES: constants.COMPARE_ENTITY_TYPES,
    extractAgentCompareData: helpers.extractAgentCompareData,
    extractPipelineCompareData: helpers.extractPipelineCompareData,
  };
});
vi.mock('@/[fsd]/entities/version', () => ({ buildVersionOption: vi.fn(), formatVersionMeta: vi.fn() }));

const { useCompareAgentVersions } = await import('../useCompareAgentVersions.hooks');

const unwrapping = value => ({
  unwrap: () => (value instanceof Error ? Promise.reject(value) : Promise.resolve(value)),
});

const LEFT = {
  id: 1,
  name: 'base',
  instructions: 'nodes:\n  - id: a\n',
  welcome_message: 'Hi',
  conversation_starters: ['Go'],
  meta: { step_limit: 30 },
  pipeline_settings: { nodes: [{ id: 'a', position: { x: 1, y: 2 } }], edges: [] },
  tools: [{ type: 'github', id: 9 }],
};
const RIGHT = { ...LEFT, id: 2, name: 'v2', instructions: 'nodes:\n  - id: b\n' };

const renderPipelineHook = () =>
  renderHook(() => useCompareAgentVersions({ projectId: 3, applicationId: 4, entityType: 'pipeline' }));

const saveArgs = (result, overrides) => ({
  versionId: 1,
  versionName: 'base',
  data: result.leftData,
  edits: {},
  setEdits: vi.fn(),
  setData: vi.fn(),
  ...overrides,
});

describe('useCompareAgentVersions for pipelines', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fetchVersion.mockImplementation(({ versionId }) => unwrapping(versionId === 1 ? LEFT : RIGHT));
    mocks.updateVersion.mockImplementation(() => unwrapping({}));
  });
  afterEach(() => cleanup());

  it('loads pipeline data without asking for skills', async () => {
    const { result } = renderPipelineHook();
    let loaded;
    await act(async () => {
      loaded = await result.current.loadVersions(1, 2);
    });
    expect(mocks.fetchSkills).not.toHaveBeenCalled();
    expect(loaded.leftData.instructions).toBe(LEFT.instructions);
    expect(loaded.leftData.run_settings.step_limit).toBe(30);
  });

  it('saves only the YAML and sends every other field as stored', async () => {
    const { result } = renderPipelineHook();
    let loaded;
    await act(async () => {
      loaded = await result.current.loadVersions(1, 2);
    });
    await act(async () => {
      await result.current.onSaveLeft(
        saveArgs(loaded, {
          fieldPayload: { instructions: 'nodes: []\n' },
          // An unsaved welcome edit in another step must not ride along
          edits: { instructions: 'nodes: []\n', welcome_message: 'unsaved' },
        }),
      );
    });
    const body = mocks.updateVersion.mock.calls[0][0];
    expect(body).toMatchObject({
      instructions: 'nodes: []\n',
      welcome_message: 'Hi',
      conversation_starters: ['Go'],
      meta: LEFT.meta,
      pipeline_settings: LEFT.pipeline_settings,
      tools: LEFT.tools,
    });
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Version "base" has been updated.');
  });

  it('keeps a first save when the same version is saved again', async () => {
    const { result } = renderPipelineHook();
    let loaded;
    await act(async () => {
      loaded = await result.current.loadVersions(1, 2);
    });
    await act(async () => {
      await result.current.onSaveLeft(saveArgs(loaded, { fieldPayload: { instructions: 'nodes: []\n' } }));
    });
    await act(async () => {
      await result.current.onSaveLeft(
        saveArgs(loaded, {
          data: { ...loaded.leftData, instructions: 'nodes: []\n' },
          fieldPayload: { welcome_message: 'Hello' },
        }),
      );
    });
    expect(mocks.updateVersion.mock.calls[1][0]).toMatchObject({
      instructions: 'nodes: []\n',
      welcome_message: 'Hello',
    });
  });

  it('keeps the edits and shows the error toast when the save is refused', async () => {
    mocks.updateVersion.mockImplementation(() => unwrapping(new Error('400')));
    const { result } = renderPipelineHook();
    let loaded;
    await act(async () => {
      loaded = await result.current.loadVersions(1, 2);
    });
    const args = saveArgs(loaded, { fieldPayload: { instructions: 'nodes: []\n' } });
    await act(async () => {
      await result.current.onSaveLeft(args);
    });
    expect(mocks.toastError).toHaveBeenCalledWith('Failed to save. Please try again.');
    expect(args.setEdits).not.toHaveBeenCalled();
    expect(args.setData).not.toHaveBeenCalled();
  });

  it('puts a saved base YAML and its rebuilt canvas into both editor caches', async () => {
    const { result } = renderPipelineHook();
    let loaded;
    await act(async () => {
      loaded = await result.current.loadVersions(1, 2);
    });
    await act(async () => {
      await result.current.onSaveLeft(saveArgs(loaded, { fieldPayload: { instructions: 'nodes: []\n' } }));
    });

    let fields;
    act(() => {
      fields = result.current.flushLeftSaves();
    });
    expect(fields).toEqual({ instructions: 'nodes: []\n' });
    const endpoints = mocks.updateQueryData.mock.calls.map(call => call[0]);
    expect(endpoints).toEqual(['applicationDetails', 'getApplicationVersionDetail']);
    expect(mocks.updateQueryData.mock.calls[1][1]).toEqual({ projectId: 3, applicationId: 4, versionId: 1 });

    // Each recipe writes the YAML and the canvas rebuilt from it
    const detailsDraft = { version_details: { pipeline_settings: LEFT.pipeline_settings } };
    mocks.updateQueryData.mock.calls[0][2](detailsDraft);
    expect(detailsDraft.version_details.instructions).toBe('nodes: []\n');
    expect(detailsDraft.version_details.pipeline_settings).toEqual({ nodes: [{ id: 'rebuilt' }], edges: [] });
    expect(mocks.rebuild).toHaveBeenCalledWith('nodes: []\n', LEFT.pipeline_settings);
  });

  it('touches no cache when nothing was saved to the base version', () => {
    const { result } = renderPipelineHook();
    expect(result.current.flushLeftSaves()).toBeNull();
    expect(mocks.dispatch).not.toHaveBeenCalled();
  });

  it('still patches the editor after the versions are loaded again (Change versions, then Compare)', async () => {
    const { result } = renderPipelineHook();
    let loaded;
    await act(async () => {
      loaded = await result.current.loadVersions(1, 2);
    });
    await act(async () => {
      await result.current.onSaveLeft(saveArgs(loaded, { fieldPayload: { instructions: 'nodes: []\n' } }));
    });

    // The user goes back to the selection and compares again, then closes the dialog
    await act(async () => {
      await result.current.loadVersions(1, 2);
    });
    let fields;
    act(() => {
      fields = result.current.flushLeftSaves();
    });

    expect(fields).toEqual({ instructions: 'nodes: []\n' });
    expect(mocks.updateQueryData.mock.calls.map(call => call[0])).toEqual([
      'applicationDetails',
      'getApplicationVersionDetail',
    ]);
  });
});
