// @vitest-environment jsdom
import { Formik } from 'formik';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { act, cleanup, renderHook } from '@testing-library/react';

import useSaveSkill from '../useSaveSkill.hooks';

const spies = vi.hoisted(() => ({ updateSkill: vi.fn() }));

vi.mock('@/[fsd]/features/skill/api', () => ({
  useSkillUpdateMutation: () => [spies.updateSkill, { isLoading: false }],
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSelectedProjectId: () => 2,
  useToast: () => ({ toastError: vi.fn(), toastSuccess: vi.fn() }),
}));

const renderSave = meta =>
  renderHook(() => useSaveSkill(), {
    wrapper: ({ children }) => (
      <Formik
        initialValues={{
          id: 7,
          name: 'triage',
          description: 'Sorts issues',
          version_details: { id: 70, instructions: 'Do it.', tags: [], meta },
        }}
        onSubmit={vi.fn()}
      >
        {children}
      </Formik>
    ),
  });

const savedVersion = async meta => {
  spies.updateSkill.mockReturnValue({ unwrap: () => Promise.resolve({}) });
  const { result } = renderSave(meta);
  await act(async () => {
    await result.current.onSave();
  });
  return spies.updateSkill.mock.calls[0][0].version;
};

describe('useSaveSkill frontmatter', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('sends only the frontmatter part of the version meta', async () => {
    const version = await savedVersion({ icon_meta: { url: 'i' }, frontmatter: { license: 'MIT' } });

    expect(version.meta).toEqual({ frontmatter: { license: 'MIT' } });
  });

  it('sends an emptied frontmatter so removed keys are cleared', async () => {
    const version = await savedVersion({ frontmatter: {} });

    expect(version.meta).toEqual({ frontmatter: {} });
  });

  it('sends no meta for a version without frontmatter', async () => {
    const version = await savedVersion({ icon_meta: { url: 'i' } });

    expect(version).not.toHaveProperty('meta');
  });
});
