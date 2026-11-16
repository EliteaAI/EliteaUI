import { describe, expect, it } from 'vitest';

import {
  NESTING_REASON,
  SWARM_REASON,
  getAgentDisabledReason,
  getNestingDisabledReason,
  wouldExceedAgentNestingDepth,
} from '../agentNesting.helpers';

describe('wouldExceedAgentNestingDepth', () => {
  it('accepts A -> B -> C and rejects a fourth agent tier', () => {
    expect(wouldExceedAgentNestingDepth(2, 3)).toBe(false);
    expect(wouldExceedAgentNestingDepth(3, 3)).toBe(true);
  });

  it('counts a deeper host', () => {
    expect(wouldExceedAgentNestingDepth(2, 3, 2)).toBe(true);
  });

  it('defers to the backend when depth metadata is absent', () => {
    expect(wouldExceedAgentNestingDepth(undefined, 3)).toBe(false);
    expect(wouldExceedAgentNestingDepth(3, undefined)).toBe(false);
  });
});

describe('getNestingDisabledReason', () => {
  it('gives the reason for a row that is too deep', () => {
    const row = { name: 'Deep', agent_subtree_tiers: 3, max_agent_nesting_tiers: 3 };
    expect(getNestingDisabledReason(row)).toBe(NESTING_REASON('Deep', 3));
    expect(getNestingDisabledReason(row)).toMatch(/limited to 3 tiers/);
  });

  it('gives no reason for a row that fits or has no tier data', () => {
    expect(
      getNestingDisabledReason({ name: 'Fits', agent_subtree_tiers: 2, max_agent_nesting_tiers: 3 }),
    ).toBe('');
    expect(getNestingDisabledReason({ name: 'Unknown' })).toBe('');
  });
});

describe('getAgentDisabledReason', () => {
  it('gives the swarm reason first, even for a row that is also too deep', () => {
    const row = { name: 'Swarm', has_swarm: true, agent_subtree_tiers: 3, max_agent_nesting_tiers: 3 };
    expect(getAgentDisabledReason(row)).toBe(SWARM_REASON('Swarm'));
  });

  it('falls back to the nesting reason, then to no reason', () => {
    expect(getAgentDisabledReason({ name: 'Deep', agent_subtree_tiers: 3, max_agent_nesting_tiers: 3 })).toBe(
      NESTING_REASON('Deep', 3),
    );
    expect(getAgentDisabledReason({ name: 'Plain' })).toBe('');
  });
});
