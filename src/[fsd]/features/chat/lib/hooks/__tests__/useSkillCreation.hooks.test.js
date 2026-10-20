// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { useSkillCreation } from '../useSkillCreation.hooks';

const CREATED_SKILL = { id: 42, name: 'triage', version_details: { id: 900 } };

const renderCreation = addNewParticipants => {
  const onSkillEditorCreated = vi.fn();
  const onSetActiveParticipant = vi.fn();
  const { result } = renderHook(() =>
    useSkillCreation({
      projectId: 2,
      skillEditorSession: 3,
      onSkillEditorCreated,
      addNewParticipants,
      onSetActiveParticipant,
    }),
  );
  return { onSkillCreated: result.current.onSkillCreated, onSkillEditorCreated, onSetActiveParticipant };
};

describe('useSkillCreation', () => {
  it('adds the new skill to the chat in the shape the skills menu uses', async () => {
    const addNewParticipants = vi.fn();
    const { onSkillCreated } = renderCreation(addNewParticipants);

    await act(() => onSkillCreated(CREATED_SKILL));

    expect(addNewParticipants.mock.calls[0][0]).toEqual([
      { participantType: 'skill', ...CREATED_SKILL, project_id: 2 },
    ]);
  });

  it('switches the editor to edit the saved skill version', async () => {
    const { onSkillCreated, onSkillEditorCreated } = renderCreation(vi.fn());

    await act(() => onSkillCreated(CREATED_SKILL));

    expect(onSkillEditorCreated).toHaveBeenCalledWith(
      expect.objectContaining({
        entity_name: 'skill',
        entity_meta: { id: 42, project_id: 2 },
        entity_settings: { version_id: 900 },
      }),
      3,
    );
  });

  it('makes the added skill the active participant', async () => {
    const chatSkill = { id: 7, entity_name: 'skill', entity_meta: { id: 42, project_id: 2 } };
    const otherSkill = { id: 8, entity_name: 'skill', entity_meta: { id: 41, project_id: 2 } };
    const addNewParticipants = vi.fn((_, onAdded) => onAdded([otherSkill, chatSkill]));
    const { onSkillCreated, onSetActiveParticipant } = renderCreation(addNewParticipants);

    await act(() => onSkillCreated(CREATED_SKILL));

    expect(onSetActiveParticipant).toHaveBeenCalledWith(chatSkill);
  });
});
