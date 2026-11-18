// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { act, cleanup, renderHook } from '@testing-library/react';

const { calls, failPaths, toast } = vi.hoisted(() => ({
  calls: { upload: [], rename: [], remove: [] },
  failPaths: new Set(),
  toast: { toastError: vi.fn(), toastInfo: vi.fn(), toastSuccess: vi.fn() },
}));

const mutation = list => () => [
  args => {
    list.push(args);
    return {
      unwrap: () => (failPaths.has(args.path) ? Promise.reject({ status: 409 }) : Promise.resolve({})),
    };
  },
];

vi.mock('@/[fsd]/features/skill/api', () => ({
  useUploadSkillVersionFileMutation: mutation(calls.upload),
  useRenameSkillVersionFileMutation: mutation(calls.rename),
  useDeleteSkillVersionFileMutation: mutation(calls.remove),
  useLazySkillVersionFileBlobQuery: () => [vi.fn()],
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useToast: () => toast }));
vi.mock('@/common/utils', () => ({
  buildErrorMessage: error => `error ${error.status}`,
  downloadBlobFile: vi.fn(),
  handleCopy: vi.fn(),
}));

const { useSkillFileActions } = await import('../useSkillFileActions.hooks');

const SCOPE = { projectId: 2, skillId: 7, versionId: 70 };
const FILES = [
  { path: 'scripts/a.py' },
  { path: 'scripts/lib/b.py' },
  { path: 'scripts-old/c.py' },
  { path: 'd.md' },
];

describe('useSkillFileActions', () => {
  beforeEach(() => {
    calls.upload.length = 0;
    calls.rename.length = 0;
    calls.remove.length = 0;
    failPaths.clear();
    vi.clearAllMocks();
  });
  afterEach(() => cleanup());

  const render = extra => renderHook(() => useSkillFileActions({ ...SCOPE, files: FILES, ...extra })).result;

  it('renames a folder by moving every file under it, and no file of a folder that only shares its prefix', async () => {
    const onPathMoved = vi.fn();
    const result = render({ onPathMoved });
    await act(() => result.current.renamePath('scripts', 'tools', true));

    expect(calls.rename.map(({ path, newPath }) => [path, newPath])).toEqual([
      ['scripts/a.py', 'tools/a.py'],
      ['scripts/lib/b.py', 'tools/lib/b.py'],
    ]);
    expect(calls.rename[0]).toMatchObject(SCOPE);
    expect(onPathMoved).toHaveBeenCalledWith('scripts/a.py', 'tools/a.py');
  });

  it('deletes every file of a folder and reports the ones the backend refused', async () => {
    failPaths.add('scripts/lib/b.py');
    const onPathRemoved = vi.fn();
    const result = render({ onPathRemoved });
    await act(() => result.current.deletePath('scripts', true));

    expect(calls.remove.map(({ path }) => path)).toEqual(['scripts/a.py', 'scripts/lib/b.py']);
    expect(onPathRemoved.mock.calls).toEqual([['scripts/a.py']]);
    expect(toast.toastError).toHaveBeenCalledWith('1 file was not deleted: scripts/lib/b.py (error 409)');
  });

  it('uploads into a folder, at the root, or over the file it replaces', async () => {
    const result = render();
    const picked = new File(['x'], 'e.py');
    await act(() => result.current.uploadFiles([picked], { folder: 'scripts' }));
    await act(() => result.current.uploadFiles([picked], null));
    await act(() => result.current.uploadFiles([picked], { file: 'd.md' }));

    expect(calls.upload.map(({ path }) => path)).toEqual(['scripts/e.py', 'e.py', 'd.md']);
    expect(calls.upload[0].file).toBe(picked);
  });

  it('does not upload onto a file or folder already using the path, in any letter case', async () => {
    const result = render();
    const sameFile = new File(['x'], 'A.PY');
    const fresh = new File(['x'], 'new.py');
    await act(() => result.current.uploadFiles([sameFile, fresh], { folder: 'scripts' }));
    await act(() => result.current.uploadFiles([new File(['x'], 'Scripts')], null));

    expect(calls.upload.map(({ path }) => path)).toEqual(['scripts/new.py']);
    expect(toast.toastError.mock.calls).toEqual([
      ['A file or folder already uses scripts/A.PY: rename it first or use Replace with upload'],
      ['A file or folder already uses Scripts: rename it first or use Replace with upload'],
    ]);
  });
});
