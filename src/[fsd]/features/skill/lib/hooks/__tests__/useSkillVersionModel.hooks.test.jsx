// @vitest-environment jsdom
import { Formik } from 'formik';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { act, cleanup, renderHook } from '@testing-library/react';

import { useSkillVersionModel } from '../useSkillVersionModel.hooks';

const access = vi.hoisted(() => ({ canUpdateSkill: true }));

vi.mock('@/hooks/useCheckPermission', () => ({
  default: () => ({ checkPermission: () => access.canUpdateSkill }),
}));
vi.mock('../useSkillModels.hooks', () => ({
  useSkillModels: () => ({ models: [], isLoadingModels: false }),
}));

const renderVersionModel = status =>
  renderHook(() => useSkillVersionModel(), {
    wrapper: ({ children }) => (
      <Formik
        initialValues={{ version_details: { status, run_settings: null } }}
        onSubmit={vi.fn()}
      >
        {children}
      </Formik>
    ),
  });

describe('useSkillVersionModel editability', () => {
  afterEach(() => {
    cleanup();
    access.canUpdateSkill = true;
  });

  it('lets someone who can update a draft edit the version model', () => {
    expect(renderVersionModel('draft').result.current.canEditVersionModel).toBe(true);
  });

  it('keeps a published version model fixed', () => {
    expect(renderVersionModel('published').result.current.canEditVersionModel).toBe(false);
  });

  it('keeps the version model fixed for someone who cannot update the skill', () => {
    access.canUpdateSkill = false;

    expect(renderVersionModel('draft').result.current.canEditVersionModel).toBe(false);
  });
});

describe('useSkillVersionModel unsaved model', () => {
  afterEach(() => cleanup());

  it('reports the version model only while it differs from the saved one', async () => {
    const { result } = renderVersionModel('draft');
    expect(result.current.unsavedVersionLLMSettings).toBeNull();

    await act(async () => result.current.onSetLLMSettings({ model_name: 'haiku', model_project_id: 1 }));

    expect(result.current.unsavedVersionLLMSettings).toMatchObject({ model_name: 'haiku' });
  });
});
