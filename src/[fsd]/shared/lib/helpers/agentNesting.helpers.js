export const SWARM_REASON = name =>
  `The ${name} agent has Swarm Mode enabled and can't be added as a tool. Swarm agents are only supported in direct chat.`;

export const isSwarmVersion = version => (version?.meta?.internal_tools || []).includes('swarm');

/** Shown when the version an add flow would bind (the default one) has Swarm Mode */
export const SWARM_DEFAULT_VERSION_REASON = name =>
  `The default version of ${name} has Swarm Mode enabled and can't be added as a tool. ` +
  'Swarm agents are only supported in direct chat. Make a version without Swarm Mode its default to add it.';

/** Warning for a tool whose pinned version has Swarm Mode (enabled after it was picked) */
export const SWARM_PINNED_VERSION_WARNING =
  'This version has Swarm Mode enabled, which is only supported in direct chat. Select another version.';

export const NESTING_REASON = (name, maxTiers) =>
  `The default version of ${name} nests agents too deeply: agent nesting is limited to ${maxTiers} tiers ` +
  '(orchestrator → sub-orchestrator → leaf). Make a shallower version its default to add it.';

// Tiers the entity being edited already uses. An agent is tier 1; a pipeline is a composition primitive
// that consumes none (the backend's agent_tier_contribution), so its agents start at tier 1.
export const AGENT_HOST_TIER = 1;
export const PIPELINE_HOST_TIER = 0;

/**
 * Whether adding an agent whose subtree is `candidateSubtreeTiers` deep would pass the tier limit.
 * `hostTier` is what the entity being edited consumes (an agent by default, see PIPELINE_HOST_TIER).
 * Without both numbers from the backend it answers false: the backend check on add stays authoritative.
 */
export const wouldExceedAgentNestingDepth = (candidateSubtreeTiers, maxTiers, hostTier = AGENT_HOST_TIER) =>
  typeof candidateSubtreeTiers === 'number' &&
  typeof maxTiers === 'number' &&
  hostTier + candidateSubtreeTiers > maxTiers;

/**
 * Why a project list row can't be added as a tool because of its nesting depth.
 * Rows carry `agent_subtree_tiers` and `max_agent_nesting_tiers` when the list is asked for them.
 * @param {number} [hostTier] tiers the edited entity consumes, AGENT_HOST_TIER unless it is a pipeline
 * @returns {string} the reason, or '' when it fits
 */
export const getNestingDisabledReason = (row, hostTier) =>
  wouldExceedAgentNestingDepth(row.agent_subtree_tiers, row.max_agent_nesting_tiers, hostTier)
    ? NESTING_REASON(row.name, row.max_agent_nesting_tiers)
    : '';

/**
 * Why a project list row can't be added as a tool by an agent or pipeline: Swarm Mode first, then
 * nesting depth.
 * @param {number} [hostTier] tiers the edited entity consumes, AGENT_HOST_TIER unless it is a pipeline
 * @returns {string} the reason, or '' when it can be added
 */
export const getAgentDisabledReason = (row, hostTier) =>
  row.has_swarm ? SWARM_REASON(row.name) : getNestingDisabledReason(row, hostTier);
