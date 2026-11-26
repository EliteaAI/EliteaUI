import { describe, expect, it } from 'vitest';

import {
  AGENT_HOST_TIER,
  NESTING_REASON,
  PIPELINE_HOST_TIER,
  SWARM_REASON,
  getAgentDisabledReason,
  getNestingDisabledReason,
  isSwarmVersion,
  isVersionDisabledForTool,
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

  it('treats the edited entity as an agent unless told otherwise', () => {
    expect(AGENT_HOST_TIER).toBe(1);
    expect(wouldExceedAgentNestingDepth(3, 3)).toBe(wouldExceedAgentNestingDepth(3, 3, AGENT_HOST_TIER));
  });

  it('lets a pipeline host take an agent three tiers deep, but not four', () => {
    expect(PIPELINE_HOST_TIER).toBe(0);
    expect(wouldExceedAgentNestingDepth(3, 3, PIPELINE_HOST_TIER)).toBe(false);
    expect(wouldExceedAgentNestingDepth(4, 3, PIPELINE_HOST_TIER)).toBe(true);
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

  it('judges the same row against the host it is added to', () => {
    const row = { name: 'Orchestrator', agent_subtree_tiers: 3, max_agent_nesting_tiers: 3 };
    expect(getNestingDisabledReason(row, PIPELINE_HOST_TIER)).toBe('');
    expect(getNestingDisabledReason(row, AGENT_HOST_TIER)).toBe(NESTING_REASON('Orchestrator', 3));
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

  it('passes the host tier on to the nesting check', () => {
    const row = { name: 'Orchestrator', agent_subtree_tiers: 3, max_agent_nesting_tiers: 3 };
    expect(getAgentDisabledReason(row, PIPELINE_HOST_TIER)).toBe('');
    expect(getAgentDisabledReason(row)).toBe(NESTING_REASON('Orchestrator', 3));
  });

  it('falls back to the nesting reason, then to no reason', () => {
    expect(getAgentDisabledReason({ name: 'Deep', agent_subtree_tiers: 3, max_agent_nesting_tiers: 3 })).toBe(
      NESTING_REASON('Deep', 3),
    );
    expect(getAgentDisabledReason({ name: 'Plain' })).toBe('');
  });
});

describe('isSwarmVersion', () => {
  it('detects a swarm version from its meta', () => {
    expect(isSwarmVersion({ meta: { internal_tools: ['swarm'] } })).toBe(true);
    expect(isSwarmVersion({ meta: { internal_tools: ['attachments'] } })).toBe(false);
    expect(isSwarmVersion(undefined)).toBe(false);
  });
});

describe('isVersionDisabledForTool', () => {
  it('disables a version with Swarm Mode, the one a tool pins included', () => {
    expect(isVersionDisabledForTool({ id: 2, meta: { internal_tools: ['swarm'] } })).toBe(true);
  });

  it('leaves a version without Swarm Mode pickable', () => {
    expect(isVersionDisabledForTool({ id: 1, meta: {} })).toBe(false);
  });
});
