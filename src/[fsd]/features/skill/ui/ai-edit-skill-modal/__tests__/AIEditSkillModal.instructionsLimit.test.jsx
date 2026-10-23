// @vitest-environment jsdom
import { Formik } from 'formik';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

import AIEditSkillModal from '../AIEditSkillModal';

const spies = vi.hoisted(() => ({
  updateSkill: vi.fn(),
  createNewVersion: vi.fn(),
  toastError: vi.fn(),
  draft: null,
}));

vi.mock('@/[fsd]/entities/edit-entity-with-ai', () => ({
  EditEntityGeneralStep: () => null,
  EditEntityInstructionsStep: () => null,
  EditEntityModal: ({ onSaveAsVersion }) => (
    <button
      data-testid="save-as-version"
      onClick={() => onSaveAsVersion(spies.draft)}
    />
  ),
}));
vi.mock('@/[fsd]/features/skill/api', () => ({
  useGenerateSkillDraftMutation: () => [vi.fn(), { error: null, reset: vi.fn() }],
  useSkillUpdateMutation: () => [spies.updateSkill],
}));
vi.mock('@/[fsd]/features/skill/lib/hooks', () => ({
  useSaveSkill: () => ({ onSave: vi.fn() }),
  useSaveSkillVersion: () => ({ onCreateNewVersion: spies.createNewVersion }),
  useSkillInstructionsMaxLength: () => 1200,
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSelectedProjectId: () => 2,
  useToast: () => ({ toastError: spies.toastError }),
}));
vi.mock('@/[fsd]/shared/ui', () => ({
  Input: {
    InputBase: ({ value, onChange, inputProps }) => (
      <input
        value={value}
        onChange={onChange}
        {...inputProps}
      />
    ),
  },
  Modal: {
    BaseModal: ({ open, content, onConfirm, confirmButtonTestId }) =>
      open ? (
        <div>
          {content}
          <button
            data-testid={confirmButtonTestId}
            onClick={onConfirm}
          />
        </div>
      ) : null,
  },
}));
vi.mock('../steps', () => ({ SummaryStep: () => null }));

const saveAsVersion = async instructions => {
  spies.draft = { name: 'reviewer', description: 'Reviews code', instructions };
  render(
    <Formik
      initialValues={{
        id: 7,
        name: 'reviewer',
        description: 'd',
        versions: [],
        version_details: { instructions: '' },
      }}
      onSubmit={vi.fn()}
    >
      <AIEditSkillModal
        open
        onClose={vi.fn()}
      />
    </Formik>,
  );
  fireEvent.click(screen.getByTestId('save-as-version'));
  fireEvent.change(screen.getByTestId('ai-edit-skill-version-dialog-name-input'), {
    target: { value: 'v2' },
  });
  await act(async () => fireEvent.click(screen.getByTestId('ai-edit-skill-version-dialog-save-button')));
};

describe('AIEditSkillModal save as version instructions limit', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('saves nothing when the drafted instructions are over the limit', async () => {
    await saveAsVersion('i'.repeat(1201));

    expect(spies.updateSkill).not.toHaveBeenCalled();
    expect(spies.createNewVersion).not.toHaveBeenCalled();
    expect(spies.toastError).toHaveBeenCalledWith(
      'Instructions are 1201 characters long. Maximum allowed is 1200 characters.',
    );
  });

  it('saves the skill fields and the version when the drafted instructions fit', async () => {
    spies.updateSkill.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    spies.createNewVersion.mockResolvedValue({ id: 71 });

    await saveAsVersion('i'.repeat(1200));

    expect(spies.updateSkill).toHaveBeenCalled();
    expect(spies.createNewVersion).toHaveBeenCalledWith('v2');
  });
});
