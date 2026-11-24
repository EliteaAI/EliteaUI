// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { act, cleanup, renderHook } from '@testing-library/react';

const { calls, failing, toast } = vi.hoisted(() => ({
  calls: { update: [], saveText: [] },
  failing: { update: false, fileLists: new Set(), paths: new Set() },
  toast: { toastError: vi.fn(), toastSuccess: vi.fn() },
}));

const details = versionId => ({
  version_details: {
    id: versionId,
    name: `v${versionId}`,
    status: 'draft',
    instructions: `text ${versionId}`,
  },
});
const lazy = resolve => () => [args => ({ unwrap: () => Promise.resolve(resolve(args)) })];

vi.mock('@/[fsd]/entities/compare-versions', () => ({
  extractSkillCompareData: detail => ({ instructions: detail.version_details.instructions }),
}));
vi.mock('@/[fsd]/features/skill/api', () => ({
  useLazySkillDetailsQuery: lazy(({ versionId }) => details(versionId)),
  useLazySkillVersionFilesQuery: () => [
    ({ versionId }) => ({
      unwrap: () =>
        failing.fileLists.has(versionId)
          ? Promise.reject({ status: 500 })
          : Promise.resolve([{ path: `only-in-${versionId}.md` }]),
    }),
  ],
  useSkillUpdateMutation: () => [
    args => {
      calls.update.push(args);
      return { unwrap: () => (failing.update ? Promise.reject({ status: 500 }) : Promise.resolve({})) };
    },
  ],
  useSaveSkillVersionFileTextMutation: () => [
    args => {
      calls.saveText.push(args);
      return {
        unwrap: () => (failing.paths.has(args.path) ? Promise.reject({ status: 409 }) : Promise.resolve({})),
      };
    },
  ],
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useToast: () => toast }));
vi.mock('@/common/utils', () => ({ buildErrorMessage: error => `error ${error.status}` }));

const { useCompareSkillVersions } = await import('../useCompareSkillVersions.hooks');

const applied = setter => setter.mock.calls.reduce((state, [update]) => update(state), {});

describe('useCompareSkillVersions', () => {
  beforeEach(() => {
    calls.update.length = 0;
    calls.saveText.length = 0;
    failing.update = false;
    failing.fileLists.clear();
    failing.paths.clear();
    vi.clearAllMocks();
  });
  afterEach(() => cleanup());

  const setup = async () => {
    const { result } = renderHook(() => useCompareSkillVersions({ projectId: 2, skillId: 7 }));
    let loaded;
    await act(async () => {
      loaded = await result.current.loadVersions(70, 71);
    });
    return { result, loaded };
  };

  const save = async (result, fieldPayload) => {
    const setEdits = vi.fn();
    const setData = vi.fn();
    await act(async () => {
      await result.current.onSaveLeft({
        fieldPayload,
        data: { instructions: 'text 70' },
        edits: fieldPayload,
        versionId: 70,
        versionName: 'v70',
        setEdits,
        setData,
      });
    });
    return { setEdits, setData };
  };

  it('loads the files and the status of both versions with their details', async () => {
    const { loaded } = await setup();
    expect(loaded.leftData.files).toEqual([{ path: 'only-in-70.md' }]);
    expect(loaded.rightData.files).toEqual([{ path: 'only-in-71.md' }]);
    expect(loaded.leftVersionMeta).toMatchObject({ id: 70, status: 'draft' });
  });

  it('still opens the comparison, with files of neither version, when one file list cannot be loaded', async () => {
    failing.fileLists.add(70);
    const { loaded } = await setup();
    expect(loaded.leftData).toEqual({ instructions: 'text 70', files: [] });
    expect(loaded.rightData.files).toEqual([]);
  });

  it('saves a file edit as text to that version, without touching the version itself', async () => {
    const { result } = await setup();
    const { setEdits, setData } = await save(result, { 'file:scripts/fill.py': 'print(2)' });
    expect(calls.update).toEqual([]);
    expect(calls.saveText).toEqual([
      { projectId: 2, skillId: 7, versionId: 70, path: 'scripts/fill.py', content: 'print(2)' },
    ]);
    expect(applied(setEdits)).toEqual({});
    expect(applied(setData)).toEqual({ 'file:scripts/fill.py': 'print(2)' });
    expect(toast.toastSuccess).toHaveBeenCalledWith('Version "v70" has been updated.');
  });

  it('saves the instructions and every edited file in one go', async () => {
    const { result } = await setup();
    await save(result, { instructions: 'new', 'file:a.md': 'A', 'file:b.md': 'B' });
    expect(calls.update).toHaveLength(1);
    expect(calls.update[0]).toMatchObject({ versionId: 70, instructions: 'new' });
    expect(calls.saveText.map(call => call.path)).toEqual(['a.md', 'b.md']);
  });

  it('keeps the edit of a file that was not saved, and says which', async () => {
    failing.paths.add('b.md');
    const { result } = await setup();
    const fieldPayload = { instructions: 'new', 'file:a.md': 'A', 'file:b.md': 'B' };
    const { setEdits, setData } = await save(result, fieldPayload);
    expect(setEdits.mock.calls.reduce((state, [update]) => update(state), fieldPayload)).toEqual({
      'file:b.md': 'B',
    });
    expect(applied(setData)).toEqual({ instructions: 'new', 'file:a.md': 'A' });
    expect(toast.toastError).toHaveBeenCalledWith('b.md was not saved: error 409');
    expect(toast.toastSuccess).not.toHaveBeenCalled();
  });

  it('still saves the files when the version itself is refused', async () => {
    failing.update = true;
    const { result } = await setup();
    const { setData } = await save(result, { instructions: 'new', 'file:a.md': 'A' });
    expect(applied(setData)).toEqual({ 'file:a.md': 'A' });
    expect(toast.toastError).toHaveBeenCalledWith('Failed to save. Please try again.');
  });
});
