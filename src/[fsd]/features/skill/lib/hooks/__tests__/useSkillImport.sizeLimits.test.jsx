// @vitest-environment jsdom
import JSZip from 'jszip';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { act, cleanup, renderHook } from '@testing-library/react';

import { useSkillImport } from '../useSkillImport.hooks';

const KB = 1024;
const MB = KB * KB;
const DEFAULT_LIMITS = { max_file_bytes: 10 * MB, max_package_bytes: 30 * MB, max_package_files: 500 };

const spies = vi.hoisted(() => ({
  importSkill: vi.fn(),
  toastInfo: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  limitsRequest: vi.fn(),
}));

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('@/[fsd]/entities/import-wizard/api', async importOriginal => ({
  ...(await importOriginal()),
  useLazySkillsLimitsQuery: () => [spies.limitsRequest],
}));
vi.mock('@/[fsd]/features/skill/api', () => ({
  useSkillImportMutation: () => [spies.importSkill, { isLoading: false }],
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSelectedProjectId: () => 2,
  useToast: () => ({
    toastInfo: spies.toastInfo,
    toastSuccess: spies.toastSuccess,
    toastError: spies.toastError,
  }),
}));

const skillMd = name => `---\nname: ${name}\ndescription: Fills forms\n---\n\nBody.`;

const zipOf = async (members, fileName = 'pkg.zip') => {
  const zip = new JSZip();
  Object.entries(members).forEach(([name, content]) => zip.file(name, content));
  return new File([await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' })], fileName, {
    type: 'application/zip',
  });
};

const bytes = size => new Uint8Array(size);

const answerLimits = limits =>
  spies.limitsRequest.mockReturnValue({
    unwrap: () => (limits instanceof Error ? Promise.reject(limits) : Promise.resolve(limits)),
  });

const stage = async file => {
  const fileInput = document.createElement('input');
  const createElement = vi.spyOn(document, 'createElement').mockReturnValue(fileInput);
  const hook = renderHook(() => useSkillImport());
  await act(async () => {
    hook.result.current.openFileDialog();
    await fileInput.onchange({ target: { files: [file], value: file.name } });
  });
  createElement.mockRestore();
  return hook;
};

const expectRefused = (hook, fileName, reason) => {
  expect(spies.toastError).toHaveBeenCalledWith(`Not supported file [${fileName}]: ${reason}`);
  expect(hook.result.current.isModalOpen).toBe(false);
  expect(spies.importSkill).not.toHaveBeenCalled();
};

describe('useSkillImport refuses a ZIP over the skill package caps before the dialog', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('asks for fresh limits of the selected project on every Import click', async () => {
    answerLimits(DEFAULT_LIMITS);
    await stage(await zipOf({ 'pdf/SKILL.md': skillMd('pdf') }));
    await stage(await zipOf({ 'pdf/SKILL.md': skillMd('pdf') }));

    expect(spies.limitsRequest.mock.calls).toEqual([[{ projectId: 2 }], [{ projectId: 2 }]]);
  });

  it('refuses a file over the file cap with the server message', async () => {
    answerLimits({ ...DEFAULT_LIMITS, max_file_bytes: MB });
    const hook = await stage(
      await zipOf({ 'pdf/SKILL.md': skillMd('pdf'), 'pdf/big.bin': bytes(MB + 1) }, 'big.zip'),
    );

    expectRefused(hook, 'big.zip', "'big.bin' is 1.0 MB; a skill file can be at most 1.0 MB");
  });

  it('rounds a size half to even like the server', async () => {
    answerLimits(DEFAULT_LIMITS);
    const hook = await stage(
      await zipOf({ 'pdf/SKILL.md': skillMd('pdf'), 'pdf/big.bin': bytes(10747904) }, 'tie.zip'),
    );

    expectRefused(hook, 'tie.zip', "'big.bin' is 10.2 MB; a skill file can be at most 10.0 MB");
  });

  it('reports the running total at the file that crosses the package cap, in archive order', async () => {
    answerLimits({ ...DEFAULT_LIMITS, max_package_bytes: 2 * MB });
    const hook = await stage(
      await zipOf(
        {
          'pdf/SKILL.md': skillMd('pdf'),
          'pdf/z.bin': bytes(MB),
          'pdf/a.bin': bytes(MB + MB / 2),
          'pdf/m.bin': bytes((3 * MB) / 4),
        },
        'total.zip',
      ),
    );

    expectRefused(
      hook,
      'total.zip',
      "the version's files would be 2.5 MB; a skill version can hold at most 2.0 MB",
    );
  });

  it('counts an empty file as zero bytes, so it cannot switch the package cap off', async () => {
    answerLimits({ ...DEFAULT_LIMITS, max_package_bytes: 2 * MB });
    const hook = await stage(
      await zipOf(
        {
          'pdf/SKILL.md': skillMd('pdf'),
          'pdf/.gitkeep': '',
          'pdf/a.bin': bytes(MB),
          'pdf/b.bin': bytes(MB + 1),
        },
        'empty.zip',
      ),
    );

    expectRefused(
      hook,
      'empty.zip',
      "the version's files would be 2.0 MB; a skill version can hold at most 2.0 MB",
    );
  });

  it('refuses more files than the count cap, SKILL.md not counted', async () => {
    answerLimits({ ...DEFAULT_LIMITS, max_package_files: 2 });
    const hook = await stage(
      await zipOf(
        { 'pdf/SKILL.md': skillMd('pdf'), 'pdf/a.md': 'a', 'pdf/b.md': 'b', 'pdf/c.md': 'c' },
        'n.zip',
      ),
    );

    expectRefused(hook, 'n.zip', 'a skill version can hold at most 2 files');
  });

  it('refuses an oversize SKILL.md without inflating it', async () => {
    answerLimits({ ...DEFAULT_LIMITS, max_file_bytes: MB });
    const file = await zipOf({ 'pdf/SKILL.md': skillMd('pdf') + 'x'.repeat(2 * MB) }, 'bomb.zip');
    const zipObjectPrototype = Object.getPrototypeOf(new JSZip().file('probe', 'x').file('probe'));
    const inflate = vi.spyOn(zipObjectPrototype, 'async');

    const hook = await stage(file);

    expectRefused(hook, 'bomb.zip', 'SKILL.md is 2.0 MB; a skill file can be at most 1.0 MB');
    expect(inflate).not.toHaveBeenCalled();
  });

  it('counts a plugin folder without SKILL.md towards the plugin total, as the server does', async () => {
    answerLimits({ ...DEFAULT_LIMITS, max_package_bytes: MB });
    const hook = await stage(
      await zipOf(
        {
          '.claude-plugin/plugin.json': '{"name": "tools"}',
          'skills/forms/SKILL.md': skillMd('forms'),
          'skills/shared/data.bin': bytes(MB),
        },
        'plugin.zip',
      ),
    );

    expectRefused(
      hook,
      'plugin.zip',
      "the plugin's skills and commands are 1.0 MB; a plugin can hold at most 1.0 MB",
    );
  });

  it('labels a plugin skill by its path, as the server does', async () => {
    answerLimits({ ...DEFAULT_LIMITS, max_file_bytes: MB });
    const hook = await stage(
      await zipOf(
        {
          '.claude-plugin/plugin.json': '{"name": "tools"}',
          'skills/forms/SKILL.md': skillMd('forms') + 'x'.repeat(MB),
        },
        'plugin.zip',
      ),
    );

    expectRefused(
      hook,
      'plugin.zip',
      "'skills/forms/SKILL.md' is 1.0 MB; a skill file can be at most 1.0 MB",
    );
  });

  it('leaves plugin files the server ignores out of the plugin total', async () => {
    answerLimits({ ...DEFAULT_LIMITS, max_package_bytes: MB });
    const hook = await stage(
      await zipOf(
        {
          '.claude-plugin/plugin.json': '{"name": "tools"}',
          'skills/forms/SKILL.md': skillMd('forms'),
          'assets/logo.bin': bytes(2 * MB),
        },
        'plugin.zip',
      ),
    );

    expect(spies.toastError).not.toHaveBeenCalled();
    expect(hook.result.current.pendingSkills.map(skill => skill.name)).toEqual(['forms']);
  });

  it('accepts a package between the default and a raised cap', async () => {
    answerLimits({ ...DEFAULT_LIMITS, max_file_bytes: 12 * MB });
    const hook = await stage(await zipOf({ 'pdf/SKILL.md': skillMd('pdf'), 'pdf/big.bin': bytes(11 * MB) }));

    expect(spies.toastError).not.toHaveBeenCalled();
    expect(hook.result.current.isModalOpen).toBe(true);
  });

  it('leaves the refusal to the server when the limits cannot be read', async () => {
    answerLimits(new Error('offline'));
    const hook = await stage(await zipOf({ 'pdf/SKILL.md': skillMd('pdf'), 'pdf/big.bin': bytes(11 * MB) }));

    expect(spies.toastError).not.toHaveBeenCalled();
    expect(hook.result.current.isModalOpen).toBe(true);
  });

  it('stops waiting for limits that never arrive and lets the server decide', async () => {
    spies.limitsRequest.mockReturnValue({ unwrap: () => new Promise(() => {}) });
    const file = await zipOf({ 'pdf/SKILL.md': skillMd('pdf'), 'pdf/big.bin': bytes(11 * MB) });
    vi.useFakeTimers({ toFake: ['setTimeout'] });
    try {
      const staging = stage(file);
      await vi.advanceTimersByTimeAsync(5000);
      const hook = await staging;

      expect(spies.toastError).not.toHaveBeenCalled();
      expect(hook.result.current.isModalOpen).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not wait for the limits to import a Markdown file', async () => {
    spies.limitsRequest.mockReturnValue({ unwrap: () => new Promise(() => {}) });
    const hook = await stage(new File([skillMd('pdf')], 'pdf.md'));

    expect(hook.result.current.pendingSkills.map(skill => skill.name)).toEqual(['pdf']);
  });
});
