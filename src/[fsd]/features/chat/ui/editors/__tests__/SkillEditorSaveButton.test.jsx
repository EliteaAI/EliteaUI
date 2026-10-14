// @vitest-environment jsdom
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

const clickSave = async isSaved => {
  saveResult.current = isSaved;
  const onSaved = vi.fn();
  render(
    <SkillEditorSaveButton
      isDirty
      onSaved={onSaved}
    />,
  );
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Save' })));
  return onSaved;
};

describe('SkillEditorSaveButton', () => {
  afterEach(() => cleanup());

  it('reports a successful save', async () => {
    expect(await clickSave(true)).toHaveBeenCalledTimes(1);
  });

  it('stays silent when the save fails', async () => {
    expect(await clickSave(false)).not.toHaveBeenCalled();
  });
});
