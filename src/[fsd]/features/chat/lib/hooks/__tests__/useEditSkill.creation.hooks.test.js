// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { useEditSkill } from '../useEditSkill.hooks';
import { useSkillCreation } from '../useSkillCreation.hooks';

vi.mock('@/hooks/useNavBlocker', () => ({
  default: () => ({ isEditingSkill: true, setSkillEditingBlockNav: () => {} }),
}));

const FIRST_SKILL = { id: 41, name: 'first', version_details: { id: 801 } };

const renderSkillEditing = addNewParticipants =>
  renderHook(() => {
    const editing = useEditSkill();
    const { onSkillCreated } = useSkillCreation({
      projectId: 2,
      skillEditorSession: editing.skillEditorSession,
      onSkillEditorCreated: editing.onSkillEditorCreated,
      addNewParticipants,
    });
    return { ...editing, onSkillCreated };
  }).result;

describe('skill creator sessions', () => {
  it('switches the creator that saved to editing the new skill', async () => {
    const result = renderSkillEditing(vi.fn());
    act(() => result.current.onShowSkillEditorCreator());

    await act(() => result.current.onSkillCreated(FIRST_SKILL));

    expect(result.current.isSkillCreateMode).toBe(false);
    expect(result.current.editingSkill.entity_meta.id).toBe(41);
  });

  it('leaves a later draft alone when an earlier save resolves after the creator was closed', async () => {
    const addNewParticipants = vi.fn();
    const result = renderSkillEditing(addNewParticipants);
    act(() => result.current.onShowSkillEditorCreator());
    const firstSaveCompletion = result.current.onSkillCreated;

    act(() => result.current.onCloseSkillEditor());
    act(() => result.current.onShowSkillEditorCreator());
    await act(() => firstSaveCompletion(FIRST_SKILL));

    expect(result.current.isSkillCreateMode).toBe(true);
    expect(result.current.editingSkill).toBeNull();
    expect(addNewParticipants.mock.calls[0][0][0].id).toBe(41);
  });
});
