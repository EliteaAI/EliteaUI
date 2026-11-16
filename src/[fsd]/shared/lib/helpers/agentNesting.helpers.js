export const SWARM_REASON = name =>
  `The ${name} agent has Swarm Mode enabled and can't be added as a tool. Swarm agents are only supported in direct chat.`;

export const NESTING_REASON = (name, maxTiers) =>
  `The default version of ${name} nests agents too deeply: agent nesting is limited to ${maxTiers} tiers ` +
  '(orchestrator → sub-orchestrator → leaf). Make a shallower version its default to add it.';

/**
 * Whether adding an agent whose subtree is `candidateSubtreeTiers` deep would pass the tier limit.
 * The entity being edited is the host (tier 1 by default). Without both numbers from the backend it
 * answers false: the backend check on add stays authoritative.
 */
export const wouldExceedAgentNestingDepth = (candidateSubtreeTiers, maxTiers, hostTier = 1) =>
  typeof candidateSubtreeTiers === 'number' &&
  typeof maxTiers === 'number' &&
  hostTier + candidateSubtreeTiers > maxTiers;

/**
 * Why a project list row can't be added as a tool because of its nesting depth.
 * Rows carry `agent_subtree_tiers` and `max_agent_nesting_tiers` when the list is asked for them.
 * @returns {string} the reason, or '' when it fits
 */
export const getNestingDisabledReason = row =>
  wouldExceedAgentNestingDepth(row.agent_subtree_tiers, row.max_agent_nesting_tiers)
    ? NESTING_REASON(row.name, row.max_agent_nesting_tiers)
    : '';

/**
 * Why a project list row can't be added as a tool by an agent or pipeline: Swarm Mode first, then
 * nesting depth.
 * @returns {string} the reason, or '' when it can be added
 */
export const getAgentDisabledReason = row =>
  row.has_swarm ? SWARM_REASON(row.name) : getNestingDisabledReason(row);
