import { describe, expect, it } from 'vitest';

import { applyParticipantChanges } from '../restrictAccess.helpers';

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
