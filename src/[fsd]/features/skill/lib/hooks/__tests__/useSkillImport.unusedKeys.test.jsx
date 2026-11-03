// @vitest-environment jsdom
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

const SKILL_MD = '---\nname: notes\ndescription: Drafts notes\nallowed-tools: Read\n---\n\nBody';

const importWith = async response => {
  spies.importSkill.mockReturnValue({ unwrap: () => Promise.resolve(response) });
  const fileInput = document.createElement('input');
  const createElement = vi.spyOn(document, 'createElement').mockReturnValue(fileInput);
  const { result } = renderHook(() => useSkillImport());
  const file = new File([SKILL_MD], 'notes.md', { type: 'text/markdown' });

  await act(async () => {
    result.current.openFileDialog();
    await fileInput.onchange({ target: { files: [file], value: 'notes.md' } });
  });
  createElement.mockRestore();
  await act(async () => {
    await result.current.confirmImport();
  });
};

describe('useSkillImport kept keys', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('lists the keys ELITEA keeps but does not use', async () => {
    await importWith({ id: 9, unused_frontmatter_keys: ['allowed-tools', 'argument-hint'] });

    expect(spies.toastInfo).toHaveBeenCalledWith(
      'Skill imported. Kept but not used by ELITEA: allowed-tools, argument-hint.',
    );
    expect(spies.toastSuccess).not.toHaveBeenCalled();
  });

  it('shows the plain success message when every key is used', async () => {
    await importWith({ id: 9, unused_frontmatter_keys: [] });

    expect(spies.toastSuccess).toHaveBeenCalledWith('Skill imported successfully.');
    expect(spies.toastInfo).not.toHaveBeenCalled();
  });
});
