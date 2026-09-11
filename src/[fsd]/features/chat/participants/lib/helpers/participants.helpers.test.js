import { describe, expect, it } from 'vitest';

import { areDetailsOfParticipant, isSkippedContainerParticipant } from './participants.helpers';

// --- isSkippedContainerParticipant — #5778 depth-aware container gate -------- //
//
// #5680 banned ANY container agent from being bound as an adhoc chat tool. #5778
// relaxes that to a TIER BUDGET: a container is skipped (shows the "runs only as
// active" hint) only when nesting it would exceed max_agent_nesting_tiers. The
// backend now emits agent_subtree_tiers + max_agent_nesting_tiers on the
// participant meta; when present the gate is depth-aware, when absent it falls
// back to the pre-#5778 blunt is_container ban.

const application = 'application';

const makeParticipant = (metaOverrides = {}) => ({
  entity_name: application,
  entity_settings: {},
  meta: { is_container: true, ...metaOverrides },
});

describe('isSkippedContainerParticipant — #5778 depth-aware gate', () => {
  it('does not skip a non-container participant', () => {
    expect(isSkippedContainerParticipant(makeParticipant({ is_container: false }))).toBe(false);
  });

  it('does not skip a null/undefined participant', () => {
    expect(isSkippedContainerParticipant(null)).toBe(false);
    expect(isSkippedContainerParticipant(undefined)).toBe(false);
  });

  it('allows a pipeline whose transparent agent subtree fits', () => {
    const p = makeParticipant({ agent_subtree_tiers: 2, max_agent_nesting_tiers: 3 });
    p.entity_settings.agent_type = 'pipeline';
    expect(isSkippedContainerParticipant(p)).toBe(false);
  });

  it('skips a pipeline whose agent descendants exceed the budget', () => {
    const p = makeParticipant({ agent_subtree_tiers: 3, max_agent_nesting_tiers: 3 });
    p.entity_settings.agent_type = 'pipeline';
    expect(isSkippedContainerParticipant(p)).toBe(true);
  });

  it('does NOT skip a container that still fits the tier budget (the screenshot-1 fix)', () => {
    // A tier-2 container (its own subtree is 2 tiers) under a max of 3 fits — it
    // is bindable and must NOT show the absolute-ban hint.
    expect(
      isSkippedContainerParticipant(makeParticipant({ agent_subtree_tiers: 2, max_agent_nesting_tiers: 3 })),
    ).toBe(false);
  });

  it('skips a container whose subtree fills the budget before adding the adhoc root', () => {
    expect(
      isSkippedContainerParticipant(makeParticipant({ agent_subtree_tiers: 3, max_agent_nesting_tiers: 3 })),
    ).toBe(true);
  });

  it('skips a container whose own subtree already exceeds the budget', () => {
    expect(
      isSkippedContainerParticipant(makeParticipant({ agent_subtree_tiers: 4, max_agent_nesting_tiers: 3 })),
    ).toBe(true);
  });

  it('falls back to the blunt is_container ban when tier fields are absent', () => {
    // Older backend payload with no tier fields → preserve pre-#5778 behavior so
    // a stale payload neither crashes nor spuriously unblocks.
    expect(isSkippedContainerParticipant(makeParticipant())).toBe(true);
  });

  it('falls back to the blunt ban when only one tier field is present', () => {
    expect(isSkippedContainerParticipant(makeParticipant({ agent_subtree_tiers: 2 }))).toBe(true);
    expect(isSkippedContainerParticipant(makeParticipant({ max_agent_nesting_tiers: 3 }))).toBe(true);
  });
});

// --- areDetailsOfParticipant — guards against mixing two participants -------- //
//
// Participant details are fetched asynchronously, so right after a switch they can
// still describe the participant selected before. Consumers that combine participant
// fields with details fields (version lists, version ids) must gate on this, otherwise
// they send one agent's version id under another agent's id and the backend rejects it.

const makeDetailsParticipant = entityId => ({
  entity_name: application,
  entity_meta: { id: entityId, project_id: 406 },
  entity_settings: {},
});

describe('areDetailsOfParticipant', () => {
  it('accepts details carrying the same entity id', () => {
    expect(areDetailsOfParticipant({ id: 562 }, makeDetailsParticipant(562))).toBe(true);
  });

  it('accepts a string/number id mix, since ids arrive in both shapes', () => {
    expect(areDetailsOfParticipant({ id: '562' }, makeDetailsParticipant(562))).toBe(true);
    expect(areDetailsOfParticipant({ id: 562 }, makeDetailsParticipant('562'))).toBe(true);
  });

  it('rejects details of another agent', () => {
    expect(areDetailsOfParticipant({ id: 601 }, makeDetailsParticipant(562))).toBe(false);
  });

  it('rejects details that are still empty', () => {
    expect(areDetailsOfParticipant({}, makeDetailsParticipant(562))).toBe(false);
    expect(areDetailsOfParticipant(null, makeDetailsParticipant(562))).toBe(false);
    expect(areDetailsOfParticipant(undefined, makeDetailsParticipant(562))).toBe(false);
  });

  it('rejects a missing participant or one without an entity id', () => {
    expect(areDetailsOfParticipant({ id: 562 }, null)).toBe(false);
    expect(areDetailsOfParticipant({ id: 562 }, { entity_meta: {} })).toBe(false);
  });
});
