import { describe, expect, it } from 'vitest';

import {
  applyParticipantChanges,
  buildNewParticipants,
  diffAiParticipants,
  hasParticipantChanges,
  mapAiParticipantToSelectItem,
} from '../restrictAccess.helpers';

const participant = (id, entityId) => ({ id, entity_name: 'application', entity_meta: { id: entityId } });

describe('applyParticipantChanges', () => {
  it('drops deleted participants even when a stale refetch still returns them', () => {
    const staleRefetch = [participant(24, 28), participant(80, 97), participant(82, 96)];

    const result = applyParticipantChanges(staleRefetch, { deletedIds: [80] });

    expect(result.map(p => p.id)).toEqual([24, 82]);
  });

  it('appends added participants missing from the list', () => {
    const added = participant(90, 12);

    const result = applyParticipantChanges([participant(24, 28)], { addedParticipants: [added] });

    expect(result).toEqual([participant(24, 28), added]);
  });

  it('does not duplicate added participants already present in a fresh refetch', () => {
    const freshRefetch = [participant(24, 28), participant(90, 12)];

    const result = applyParticipantChanges(freshRefetch, {
      deletedIds: [80],
      addedParticipants: [participant(90, 12)],
    });

    expect(result.map(p => p.id)).toEqual([24, 90]);
  });

  it('returns the list unchanged when there are no changes', () => {
    const list = [participant(24, 28)];

    expect(applyParticipantChanges(list)).toEqual(list);
    expect(applyParticipantChanges(undefined, { deletedIds: [1] })).toEqual([]);
  });
});

describe('restrict access tells skills and agents with the same id apart', () => {
  const PROJECT_ID = 2;
  const agent = { id: 24, entity_name: 'application', entity_meta: { id: 5, project_id: PROJECT_ID } };
  const skill = { id: 25, entity_name: 'skill', entity_meta: { id: 5, project_id: PROJECT_ID } };
  const catalogSkill = { id: 26, entity_name: 'skill', entity_meta: { id: 5, project_id: 1 } };

  it('removes only the deselected skill when an agent shares its id', () => {
    const { aiToRemove, aiToAdd } = diffAiParticipants({
      existingAiParticipants: [agent, skill],
      selectedAiParticipants: [mapAiParticipantToSelectItem(agent)],
      projectId: PROJECT_ID,
    });
    expect(aiToRemove).toEqual([skill]);
    expect(aiToAdd).toEqual([]);
  });

  it('adds a skill whose id matches an existing agent, and a Catalog skill matching an own one', () => {
    const newSkill = { id: 5, entity_name: 'skill', project_id: PROJECT_ID };
    const newCatalogSkill = { id: 5, entity_name: 'skill', project_id: 1 };
    const { aiToAdd } = diffAiParticipants({
      existingAiParticipants: [agent],
      selectedAiParticipants: [mapAiParticipantToSelectItem(agent), newSkill],
      projectId: PROJECT_ID,
    });
    expect(aiToAdd).toEqual([newSkill]);
    expect(
      diffAiParticipants({
        existingAiParticipants: [skill],
        selectedAiParticipants: [mapAiParticipantToSelectItem(skill), newCatalogSkill],
        projectId: PROJECT_ID,
      }).aiToAdd,
    ).toEqual([newCatalogSkill]);
    expect(buildNewParticipants({ usersToAdd: [], aiToAdd: [newSkill], projectId: PROJECT_ID })).toEqual([
      { entity_name: 'skill', entity_meta: { id: 5, project_id: PROJECT_ID } },
    ]);
  });

  it('never removes or adds a participant without an entity id, such as a model', () => {
    const model = { id: 30, entity_name: 'llm', entity_meta: { model_name: 'gpt-4.1' } };
    const { aiToRemove, aiToAdd } = diffAiParticipants({
      existingAiParticipants: [model],
      selectedAiParticipants: [{ entity_name: 'skill', project_id: PROJECT_ID }],
      projectId: PROJECT_ID,
    });
    expect(aiToRemove).toEqual([]);
    expect(aiToAdd).toEqual([]);
  });

  it('treats swapping an agent for a same-id skill as a change', () => {
    expect(
      hasParticipantChanges({
        isAlreadyPrivate: true,
        initialSelectedUsers: [],
        selectedUsers: [],
        initialSelectedAiParticipants: [mapAiParticipantToSelectItem(agent)],
        selectedAiParticipants: [mapAiParticipantToSelectItem(catalogSkill)],
      }),
    ).toBe(true);
  });
});
