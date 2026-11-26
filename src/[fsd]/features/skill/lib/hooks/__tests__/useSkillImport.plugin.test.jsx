// @vitest-environment jsdom
import JSZip from 'jszip';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { act, cleanup, renderHook } from '@testing-library/react';

import { useSkillImport } from '../useSkillImport.hooks';

const spies = vi.hoisted(() => ({
  importSkill: vi.fn(),
  navigate: vi.fn(),
  toastInfo: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('react-router-dom', () => ({ useNavigate: () => spies.navigate }));
vi.mock('@/[fsd]/entities/import-wizard/api', async importOriginal => ({
  ...(await importOriginal()),
  useLazySkillsLimitsQuery: () => [
    () => ({
      unwrap: () =>
        Promise.resolve({ max_file_bytes: 10485760, max_package_bytes: 31457280, max_package_files: 500 }),
    }),
  ],
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

const DEBUG_MD = '---\nname: debug\ndescription: Structured debugging.\n---\n\n# /debug\n\nReproduce first.';
const OPEN_MD =
  '---\ndescription: Open a PDF in the viewer\nargument-hint: "[path]"\n---\n\n# Open PDF\n\nCall it.';

const pluginOf = async (members, prefix = '') => {
  const zip = new JSZip();
  Object.entries({
    '.claude-plugin/plugin.json': '{"name": "pdf-viewer"}',
    '.mcp.json': '{}',
    'README.md': '# PDF Viewer',
    'CONNECTORS.md': '# Connectors',
    ...members,
  }).forEach(([name, content]) => zip.file(`${prefix}${name}`, content));
  return new File([await zip.generateAsync({ type: 'uint8array' })], 'PDF Viewer-0.2.0-v1.zip', {
    type: 'application/zip',
  });
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
  return hook;
};

describe('useSkillImport with a Claude plugin ZIP', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('previews every skill and command of the plugin, leaving its other files out', async () => {
    const hook = await stage(
      await pluginOf({
        'skills/debug/SKILL.md': DEBUG_MD,
        'skills/debug/references/steps.md': '# Steps',
        'commands/open.md': OPEN_MD,
      }),
    );

    expect(spies.toastError).not.toHaveBeenCalled();
    expect(hook.result.current.pendingSkills).toEqual([
      expect.objectContaining({
        name: 'debug',
        description: 'Structured debugging.',
        filePaths: ['references/steps.md'],
      }),
      expect.objectContaining({
        name: 'open',
        description: 'Open a PDF in the viewer',
        instructions: '# Open PDF\n\nCall it.',
        filePaths: [],
      }),
    ]);
  });

  it('reads a plugin zipped inside its folder', async () => {
    const hook = await stage(await pluginOf({ 'skills/debug/SKILL.md': DEBUG_MD }, 'pdf-viewer/'));

    expect(hook.result.current.pendingSkills.map(skill => skill.name)).toEqual(['debug']);
  });

  it.each([
    ['without frontmatter', '# Sign PDF\n\nPlace a signature.'],
    ['without a description', '---\nargument-hint: x\n---\n\n# Sign PDF\n\nPlace a signature.'],
  ])('describes a command %s by its first line', async (_, command) => {
    const hook = await stage(await pluginOf({ 'commands/sign.md': command }));

    expect(hook.result.current.pendingSkills[0]).toMatchObject({ name: 'sign', description: 'Sign PDF' });
  });

  it('cuts a description taken from a long first line to what the skill holds', async () => {
    const hook = await stage(await pluginOf({ 'commands/long.md': `# ${'x'.repeat(3000)}\n\nBody` }));

    expect(hook.result.current.pendingSkills[0].description).toBe('x'.repeat(2304));
  });

  it.each([
    ['#\nTake notes about $ARGUMENTS', 'Take notes about $ARGUMENTS'],
    ['#\n##', 'notes'],
  ])('skips a bare heading when describing a command', async (command, description) => {
    const hook = await stage(await pluginOf({ 'commands/notes.md': command }));

    expect(hook.result.current.pendingSkills[0].description).toBe(description);
  });

  it.each([['Deploy it\r\nStep 2\r\nStep 3\r\n'], ['Deploy it\rStep 2\rStep 3\r']])(
    'normalises the line endings of a command without frontmatter as the server does',
    async command => {
      const hook = await stage(await pluginOf({ 'commands/deploy.md': command }));

      expect(hook.result.current.pendingSkills[0]).toMatchObject({
        description: 'Deploy it',
        instructions: 'Deploy it\nStep 2\nStep 3',
      });
    },
  );

  it('names the skill that lacks a description', async () => {
    const hook = await stage(
      await pluginOf({
        'skills/debug/SKILL.md': DEBUG_MD,
        'skills/broken/SKILL.md': '---\nname: broken\n---\n\nBody',
      }),
    );

    expect(hook.result.current.isModalOpen).toBe(false);
    expect(spies.toastError).toHaveBeenCalledWith(expect.stringContaining('[skills/broken/SKILL.md]'));
  });

  it('reads a plugin without skills or commands as a single skill', async () => {
    const hook = await stage(await pluginOf({ 'SKILL.md': DEBUG_MD }));

    expect(spies.toastError).not.toHaveBeenCalled();
    expect(hook.result.current.pendingSkills.map(skill => skill.name)).toEqual(['debug']);
  });

  it.each([
    ['review_pr.md', 'review-pr'],
    ['revise-claude-md.md', 'revise-md'],
    ['Fill Form.md', 'fill-form'],
    [`${'a'.repeat(70)}.md`, 'a'.repeat(64)],
  ])('names the command %s as the server will: %s', async (fileName, skillName) => {
    const hook = await stage(await pluginOf({ [`commands/${fileName}`]: OPEN_MD }));

    expect(hook.result.current.pendingSkills[0].name).toBe(skillName);
  });

  it('keeps commands of different folders apart by their folder', async () => {
    const hook = await stage(
      await pluginOf({ 'commands/frontend/test.md': OPEN_MD, 'commands/backend/test.md': OPEN_MD }),
    );

    expect(hook.result.current.pendingSkills.map(skill => skill.name).sort()).toEqual([
      'backend-test',
      'frontend-test',
    ]);
  });

  it('refuses a ZIP holding more than one plugin', async () => {
    const zip = new JSZip();
    ['design', 'engineering'].forEach(plugin => {
      zip.file(`${plugin}/.claude-plugin/plugin.json`, '{}');
      zip.file(`${plugin}/skills/${plugin}/SKILL.md`, DEBUG_MD);
    });
    const file = new File([await zip.generateAsync({ type: 'uint8array' })], 'plugins.zip');

    const hook = await stage(file);

    expect(hook.result.current.isModalOpen).toBe(false);
    expect(spies.toastError).toHaveBeenCalledWith(expect.stringContaining('more than one plugin'));
  });

  it('refuses a command whose file name leaves no skill name', async () => {
    const hook = await stage(await pluginOf({ 'commands/claude.md': OPEN_MD }));

    expect(hook.result.current.isModalOpen).toBe(false);
    expect(spies.toastError).toHaveBeenCalledWith(expect.stringContaining('no valid skill name'));
  });

  it('lists the keys ELITEA keeps but does not use across the plugin, once each', async () => {
    spies.importSkill.mockReturnValue({
      unwrap: () =>
        Promise.resolve({
          skills: [
            { id: 1, unused_frontmatter_keys: ['argument-hint'] },
            { id: 2, unused_frontmatter_keys: ['argument-hint', 'allowed-tools'] },
          ],
        }),
    });
    const hook = await stage(
      await pluginOf({ 'skills/debug/SKILL.md': DEBUG_MD, 'commands/open.md': OPEN_MD }),
    );

    await act(async () => {
      await hook.result.current.confirmImport();
    });

    expect(spies.toastInfo).toHaveBeenCalledWith(
      '2 skills imported. Kept but not used by ELITEA: argument-hint, allowed-tools.',
    );
    expect(spies.toastSuccess).not.toHaveBeenCalled();
  });

  it('counts a single plugin skill in the singular', async () => {
    spies.importSkill.mockReturnValue({ unwrap: () => Promise.resolve({ skills: [{ id: 1 }] }) });
    const hook = await stage(await pluginOf({ 'skills/debug/SKILL.md': DEBUG_MD }));

    await act(async () => {
      await hook.result.current.confirmImport();
    });

    expect(spies.toastSuccess).toHaveBeenCalledWith('1 skill imported successfully.');
  });

  it('reports how many skills the server created and stays on the list', async () => {
    spies.importSkill.mockReturnValue({ unwrap: () => Promise.resolve({ skills: [{ id: 1 }, { id: 2 }] }) });
    const file = await pluginOf({ 'skills/debug/SKILL.md': DEBUG_MD, 'commands/open.md': OPEN_MD });
    const hook = await stage(file);

    await act(async () => {
      await hook.result.current.confirmImport();
    });

    expect(spies.importSkill).toHaveBeenCalledWith({ projectId: 2, file });
    expect(spies.toastSuccess).toHaveBeenCalledWith('2 skills imported successfully.');
    expect(spies.navigate).not.toHaveBeenCalled();
    expect(hook.result.current.isModalOpen).toBe(false);
  });
});
