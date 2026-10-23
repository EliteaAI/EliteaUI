// @vitest-environment jsdom
import { Formik } from 'formik';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { act, cleanup, renderHook } from '@testing-library/react';

import useSaveSkillVersion from '../useSaveSkillVersion.hooks';

const spies = vi.hoisted(() => ({ createVersion: vi.fn(), toastError: vi.fn() }));

vi.mock('@/[fsd]/features/skill/api', () => ({
  useSkillCreateVersionMutation: () => [spies.createVersion, { isLoading: false }],
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSelectedProjectId: () => 2,
  useToast: () => ({ toastError: spies.toastError, toastSuccess: vi.fn() }),
}));
vi.mock('../useSkillInstructionsMaxLength.hooks', () => ({ useSkillInstructionsMaxLength: () => 1200 }));

const renderSaveVersion = instructions =>
  renderHook(() => useSaveSkillVersion(), {
    wrapper: ({ children }) => (
      <Formik
        initialValues={{ id: 7, version_details: { instructions, tags: [], meta: {} } }}
        onSubmit={vi.fn()}
      >
        {children}
      </Formik>
    ),
  });

describe('useSaveSkillVersion instructions limit', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('refuses to copy instructions over the limit into a new version', async () => {
    const { result } = renderSaveVersion('i'.repeat(1201));

    let created;
    await act(async () => {
      created = await result.current.onCreateNewVersion('v2');
    });

    expect(created).toBeNull();
    expect(spies.createVersion).not.toHaveBeenCalled();
    expect(spies.toastError).toHaveBeenCalledWith(
      'Instructions are 1201 characters long. Maximum allowed is 1200 characters.',
    );
  });

  it('creates a version whose instructions fit the limit', async () => {
    spies.createVersion.mockReturnValue({ unwrap: () => Promise.resolve({ id: 71 }) });
    const { result } = renderSaveVersion('i'.repeat(1200));

    await act(async () => {
      await result.current.onCreateNewVersion('v2');
    });

    expect(spies.createVersion).toHaveBeenCalledWith(
      expect.objectContaining({ instructions: 'i'.repeat(1200) }),
    );
  });
});
