// @vitest-environment jsdom
import JSZip from 'jszip';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { act, cleanup, renderHook } from '@testing-library/react';

import { useSkillImport } from '../useSkillImport.hooks';

const spies = vi.hoisted(() => ({
  importSkill: vi.fn(),
  toastInfo: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
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

const SKILL_MD = '---\nname: pdf\ndescription: Fills PDF forms\n---\n\nRead forms.md first.';

const zipOf = async members => {
  const zip = new JSZip();
  Object.entries(members).forEach(([name, content]) => zip.file(name, content));
  return new File([await zip.generateAsync({ type: 'uint8array' })], 'pdf.zip', { type: 'application/zip' });
};

const stage = async file => {
  const fileInput = document.createElement('input');
  const createElement = vi.spyOn(document, 'createElement').mockReturnValue(fileInput);
  const hook = renderHook(() => useSkillImport());
  await act(async () => {
    hook.result.current.openFileDialog();
    await fileInput.onchange({ target: { files: [file], value: file.name } });
  });
  createElement.mockRestore();
  return { hook, accept: fileInput.accept };
};

describe('useSkillImport with a skill ZIP', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('offers ZIP files in the file dialog', async () => {
    const { accept } = await stage(new File([SKILL_MD], 'pdf.md'));

    expect(accept.split(',')).toEqual(expect.arrayContaining(['.md', '.zip']));
  });

  it('previews SKILL.md from the top-level folder and lists the other files relative to it', async () => {
    const file = await zipOf({
      'pdf/SKILL.md': SKILL_MD,
      'pdf/forms.md': '# Forms',
      'pdf/scripts/fill.py': 'print(1)',
      '__MACOSX/pdf/._forms.md': 'litter',
      'pdf/.DS_Store': 'litter',
    });

    const { hook } = await stage(file);

    expect(spies.toastError).not.toHaveBeenCalled();
    expect(hook.result.current.pendingSkill).toMatchObject({
      name: 'pdf',
      description: 'Fills PDF forms',
      instructions: 'Read forms.md first.',
      filePaths: ['forms.md', 'scripts/fill.py'],
    });
  });

  it('reads SKILL.md at the archive root', async () => {
    const { hook } = await stage(await zipOf({ 'SKILL.md': SKILL_MD, 'reference.md': '# Ref' }));

    expect(hook.result.current.pendingSkill.filePaths).toEqual(['reference.md']);
  });

  it('sends the ZIP itself to the server on confirm', async () => {
    spies.importSkill.mockReturnValue({ unwrap: () => Promise.resolve({ id: 9 }) });
    const file = await zipOf({ 'SKILL.md': SKILL_MD, 'forms.md': '# Forms' });
    const { hook } = await stage(file);

    await act(async () => {
      await hook.result.current.confirmImport();
    });

    expect(spies.importSkill).toHaveBeenCalledWith({ projectId: 2, file });
    expect(spies.toastSuccess).toHaveBeenCalledWith('Skill imported successfully.');
  });

  it('shows the server refusal of a ZIP', async () => {
    spies.importSkill.mockReturnValue({
      unwrap: () =>
        Promise.reject({ status: 400, data: { error: 'the skill is larger than a skill version can hold' } }),
    });
    const { hook } = await stage(await zipOf({ 'SKILL.md': SKILL_MD, 'big.bin': 'x' }));

    await act(async () => {
      await hook.result.current.confirmImport();
    });

    expect(spies.toastError).toHaveBeenCalledWith(
      expect.stringContaining('the skill is larger than a skill version can hold'),
    );
    expect(hook.result.current.isModalOpen).toBe(true);
  });

  it('refuses a ZIP without exactly one SKILL.md before asking the server', async () => {
    const { hook } = await stage(await zipOf({ 'a/SKILL.md': SKILL_MD, 'b/SKILL.md': SKILL_MD }));

    expect(hook.result.current.isModalOpen).toBe(false);
    expect(spies.toastError).toHaveBeenCalledWith(expect.stringContaining('exactly one SKILL.md'));
  });

  it('refuses a ZIP with a file outside the skill folder before asking the server', async () => {
    const { hook } = await stage(
      await zipOf({ 'pdf/SKILL.md': SKILL_MD, 'pdf/forms.md': '# Forms', 'README.md': '# R' }),
    );

    expect(hook.result.current.isModalOpen).toBe(false);
    expect(spies.toastError).toHaveBeenCalledWith(
      expect.stringContaining("'README.md' is outside the skill folder 'pdf'"),
    );
  });

  it('refuses other file types', async () => {
    const { hook } = await stage(new File(['x'], 'pdf.txt'));

    expect(hook.result.current.isModalOpen).toBe(false);
    expect(spies.toastError).toHaveBeenCalledWith('Only .md or .zip files can be imported.');
  });

  it('keeps importing a Markdown skill without files', async () => {
    const { hook } = await stage(new File([SKILL_MD], 'pdf.md'));

    expect(hook.result.current.pendingSkill).toMatchObject({ name: 'pdf', filePaths: [] });
  });
});
