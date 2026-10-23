// @vitest-environment jsdom
import { Formik } from 'formik';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

import SkillEditorCreateButton from '../SkillEditorCreateButton';

const create = vi.hoisted(() => ({ resolve: null }));

vi.mock('@/[fsd]/features/skill/lib/hooks', () => ({
  useCreateSkill: () => ({
    onCreate: () =>
      new Promise(resolve => {
        create.resolve = resolve;
      }),
    isCreating: false,
  }),
}));
vi.mock('@/[fsd]/shared/ui', () => ({
  Button: {
    BaseBtn: ({ onClick, disabled, 'data-testid': testId }) => (
      <button
        data-testid={testId}
        disabled={disabled}
        onClick={onClick}
      />
    ),
  },
}));

const FILLED = { name: 'triage', description: 'sorts issues', version_details: { instructions: 'do it' } };

const renderButton = props =>
  render(
    <Formik
      initialValues={{ name: '', description: '', version_details: { instructions: '' } }}
      onSubmit={() => {}}
    >
      {({ setValues }) => (
        <>
          <button
            data-testid="fill"
            onClick={() => setValues(FILLED)}
          />
          <SkillEditorCreateButton {...props} />
        </>
      )}
    </Formik>,
  );

const startSave = async props => {
  renderButton(props);
  await act(async () => fireEvent.click(screen.getByTestId('fill')));
  await act(async () => fireEvent.click(screen.getByTestId('chat-skill-create-button')));
};

describe('SkillEditorCreateButton', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('reports creating until the delayed request settles, then hands over the skill', async () => {
    const onCreatingChange = vi.fn();
    const onSkillCreated = vi.fn();
    await startSave({ onCreatingChange, onSkillCreated });

    expect(onCreatingChange.mock.calls).toEqual([[true]]);
    expect(onSkillCreated).not.toHaveBeenCalled();

    await act(async () => create.resolve({ id: 42 }));

    expect(onSkillCreated).toHaveBeenCalledWith({ id: 42 });
    expect(onCreatingChange.mock.calls).toEqual([[true], [false]]);
  });

  it('releases the form when the create fails', async () => {
    const onCreatingChange = vi.fn();
    const onSkillCreated = vi.fn();
    await startSave({ onCreatingChange, onSkillCreated });

    await act(async () => create.resolve(null));

    expect(onSkillCreated).not.toHaveBeenCalled();
    expect(onCreatingChange.mock.calls).toEqual([[true], [false]]);
  });
});
