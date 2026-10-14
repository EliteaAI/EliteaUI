// @vitest-environment jsdom
import { Formik } from 'formik';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

import SkillEditorSaveButton from '../SkillEditorSaveButton';

const saveResult = vi.hoisted(() => ({ current: true }));

vi.mock('@/[fsd]/features/skill/lib/hooks', () => ({
  useSaveSkill: () => ({ onSave: async () => saveResult.current, isSaving: false }),
}));
vi.mock('@/[fsd]/shared/ui', () => ({
  Button: {
    BaseBtn: ({ onClick, disabled, children }) => (
      <button
        onClick={onClick}
        disabled={disabled}
      >
        {children}
      </button>
    ),
  },
}));

const formValues = llmSettings => ({
  version_details: { instructions: 'Answer briefly', run_settings: { llm_settings: llmSettings } },
});

const clickSave = async ({ isSaved = true, initialModel = 'haiku', savedModel = 'haiku' } = {}) => {
  saveResult.current = isSaved;
  const onModelSaved = vi.fn();
  render(
    <Formik
      initialValues={formValues({ model_name: initialModel })}
      onSubmit={vi.fn()}
    >
      {({ setFieldValue }) => (
        <>
          <button
            onClick={() => setFieldValue('version_details.run_settings.llm_settings.model_name', savedModel)}
          >
            Pick
          </button>
          <button onClick={() => setFieldValue('version_details.instructions', 'Answer in detail')}>
            Edit
          </button>
          <SkillEditorSaveButton
            isDirty
            onModelSaved={onModelSaved}
          />
        </>
      )}
    </Formik>,
  );
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Edit' })));
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Pick' })));
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Save' })));
  return onModelSaved;
};

describe('SkillEditorSaveButton', () => {
  afterEach(() => cleanup());

  it('reports a saved change of the version model', async () => {
    expect(await clickSave({ savedModel: 'sonnet' })).toHaveBeenCalledTimes(1);
  });

  it('stays silent when only other fields changed', async () => {
    expect(await clickSave()).not.toHaveBeenCalled();
  });

  it('stays silent when the save fails', async () => {
    expect(await clickSave({ isSaved: false, savedModel: 'sonnet' })).not.toHaveBeenCalled();
  });
});
