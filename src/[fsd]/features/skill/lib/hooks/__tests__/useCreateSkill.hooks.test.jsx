// @vitest-environment jsdom
import { Formik } from 'formik';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { act, cleanup, renderHook } from '@testing-library/react';

import { useCreateSkill } from '../useCreateSkill.hooks';

const api = vi.hoisted(() => ({ createSkill: vi.fn(), toastError: vi.fn() }));

vi.mock('@/[fsd]/features/skill/api', () => ({
  useSkillCreateMutation: () => [api.createSkill, { isLoading: false }],
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSelectedProjectId: () => 2,
  useToast: () => ({ toastError: api.toastError }),
}));

const VALUES = {
  name: ' triage ',
  description: ' sorts issues ',
  version_details: { instructions: 'do it', tags: [], meta: {}, run_settings: null },
};

const renderCreate = (values = VALUES) =>
  renderHook(() => useCreateSkill(), {
    wrapper: ({ children }) => (
      <Formik
        initialValues={values}
        onSubmit={() => {}}
      >
        {children}
      </Formik>
    ),
  });

describe('useCreateSkill', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('creates the skill from the trimmed form values', async () => {
    api.createSkill.mockReturnValue({ unwrap: () => Promise.resolve({ id: 42 }) });
    const { result } = renderCreate();

    let created;
    await act(async () => {
      created = await result.current.onCreate();
    });

    expect(created).toEqual({ id: 42 });
    expect(api.createSkill).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: 2, name: 'triage', description: 'sorts issues' }),
    );
  });

  it('toasts a failed create exactly once and reports no skill', async () => {
    api.createSkill.mockReturnValue({ unwrap: () => Promise.reject({ data: { error: 'boom' } }) });
    const { result } = renderCreate();

    let created;
    await act(async () => {
      created = await result.current.onCreate();
    });

    expect(created).toBeNull();
    expect(api.toastError).toHaveBeenCalledTimes(1);
  });
});
