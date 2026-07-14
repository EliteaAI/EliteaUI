const asNonEmptyString = value => (typeof value === 'string' && value.trim() ? value : '');
const compactName = value => asNonEmptyString(value).replace(/\s/g, '');

/** True only for a tool action that actually delegates to an agent or pipeline. */
export const isDelegationWrapperAction = action => {
  if (!action || action.type !== 'tool') return false;
  const toolkitType = action.toolMeta?.toolkit_type;
  if (toolkitType === 'application' || toolkitType === 'pipeline') return true;

  // Older persisted wrappers may carry only agent_type. That field is also
  // inherited by ordinary LLM/tool actions, so it is not sufficient by itself.
  const isSelfNamed =
    compactName(action.name) && compactName(action.name) === compactName(action.original_name);
  const stableCallId =
    asNonEmptyString(action.parent_agent_call_id) || asNonEmptyString(action.toolMeta?.parent_agent_call_id);
  return Boolean(action.toolMeta?.agent_type && isSelfNamed && stableCallId);
};

/** Normalize the ancestry contract without mutating socket or persisted payloads. */
export const normalizeAgentPath = path =>
  (Array.isArray(path) ? path : [])
    .filter(tier => tier && typeof tier === 'object')
    .map(tier => ({
      ...tier,
      name: asNonEmptyString(tier.name),
      call_id: asNonEmptyString(tier.call_id),
      sibling_ordinal:
        Number.isInteger(tier.sibling_ordinal) && tier.sibling_ordinal > 0 ? tier.sibling_ordinal : undefined,
    }))
    .filter(tier => tier.name || tier.call_id);

/**
 * Read hierarchy fields from the first source that contains them. Socket metadata,
 * persisted steps and UI actions can all use this function and therefore converge
 * on one shape.
 */
export const normalizeExecutionHierarchy = (...sources) => {
  const validSources = sources.filter(source => source && typeof source === 'object');
  // A record can contain both a task overlay ([B]) and richer producer metadata
  // ([B, C]). Source order must not make persisted rendering discard a tier
  // that the live stream retained, so prefer the deepest populated path.
  const pathSource = validSources
    .filter(source => Array.isArray(source.parent_agent_path))
    .sort((a, b) => {
      const score = source =>
        normalizeAgentPath(source.parent_agent_path).reduce(
          (total, tier) => total + 10 + (tier.call_id ? 2 : 0) + (tier.sibling_ordinal ? 1 : 0),
          0,
        );
      return score(b) - score(a);
    })[0];
  const parentAgentPath = normalizeAgentPath(pathSource?.parent_agent_path);
  const lastTier = parentAgentPath[parentAgentPath.length - 1];
  const findString = field => {
    for (const source of validSources) {
      const value = asNonEmptyString(source[field]);
      if (value) return value;
    }
    return '';
  };

  return {
    parent_agent_name: findString('parent_agent_name') || lastTier?.name || '',
    parent_agent_call_id: findString('parent_agent_call_id') || lastTier?.call_id || '',
    parent_agent_path: parentAgentPath,
  };
};

/** The ancestry path whose final tier owns this action's UI chip. */
export const getActionOwnerPath = action => {
  if (!action) return [];
  const hierarchy = normalizeExecutionHierarchy(action, action.toolMeta);
  if (hierarchy.parent_agent_path.length) return hierarchy.parent_agent_path;

  // Root delegation wrappers have no parent path. Synthesize their owner tier
  // so the wrapper and the delegated application's [B] inner events share one
  // key. For B->C wrappers, the real [B] path above wins; C's called-tool id is
  // intentionally not used as B's owner identity.
  const isDelegationWrapper = isDelegationWrapperAction(action);
  const name =
    (isDelegationWrapper ? asNonEmptyString(action.original_name) : '') || hierarchy.parent_agent_name;
  if (!name) return [];
  const rawOrdinal = action.sibling_ordinal ?? action.toolMeta?.sibling_ordinal;
  return [
    {
      name,
      call_id: hierarchy.parent_agent_call_id,
      sibling_ordinal: Number.isInteger(rawOrdinal) && rawOrdinal > 0 ? rawOrdinal : undefined,
    },
  ];
};

export const getSubAgentName = action => {
  if (!action) return '';
  const ownerPath = getActionOwnerPath(action);
  if (ownerPath.length) return ownerPath[ownerPath.length - 1].name;
  const hierarchy = normalizeExecutionHierarchy(action, action.toolMeta);
  if (hierarchy.parent_agent_name) return hierarchy.parent_agent_name;
  const isDelegationWrapper = isDelegationWrapperAction(action);
  return isDelegationWrapper ? asNonEmptyString(action.original_name) : '';
};

export const getSubAgentInstanceKey = action => {
  if (!action) return '';
  const ownerPath = getActionOwnerPath(action);
  if (ownerPath.length) {
    return JSON.stringify(
      // sibling_ordinal is display metadata, not identity. A parked child can be
      // the second member of the initial fan-out and the only member of a later
      // resume batch, so its ordinal legitimately changes from 2 to 1 while its
      // call id remains stable. Including the ordinal split one logical leaf into
      // two accordions at the end of a HITL run.
      ownerPath.map(({ name, call_id }) => [name, call_id]),
    );
  }
  return getSubAgentName(action);
};

/**
 * Collapse replayed Application/Pipeline wrapper events onto one logical chip.
 *
 * A durable nested run emits the root wrapper and its B->C delegation wrappers
 * again after every HITL resume. These are lifecycle updates for the same tool
 * calls, not new work: the root/child call ids stay stable. Keep the first slot
 * (stable ordering/React key) and overlay the latest status/output so the parent
 * accordion shows one root chip and one chip per delegated leaf.
 */
export const collapseDelegationWrapperReplays = actions => {
  const collapsed = [];
  const indexByIdentity = new Map();

  (actions || []).forEach(action => {
    const isDelegationWrapper = isDelegationWrapperAction(action);
    if (!isDelegationWrapper) {
      collapsed.push(action);
      return;
    }

    const hierarchy = normalizeExecutionHierarchy(action, action.toolMeta);
    const ownerPath = getActionOwnerPath(action).map(({ name, call_id }) => [name, call_id]);
    const childName = asNonEmptyString(action.original_name) || asNonEmptyString(action.name);
    const identity = JSON.stringify([ownerPath, hierarchy.parent_agent_call_id, childName]);
    const existingIndex = indexByIdentity.get(identity);
    if (existingIndex === undefined) {
      indexByIdentity.set(identity, collapsed.length);
      collapsed.push(action);
      return;
    }

    const first = collapsed[existingIndex];
    collapsed[existingIndex] = {
      ...first,
      ...action,
      toolMeta: { ...first?.toolMeta, ...action?.toolMeta },
      id: first?.id ?? action?.id,
      created_at: first?.created_at ?? action?.created_at,
    };
  });

  return collapsed;
};

/** Match both the invocation itself and descendants whose ancestry contains it. */
export const actionBelongsToInvocationSet = (action, invocationIds) => {
  if (!action || !invocationIds?.size) return false;
  const hierarchy = normalizeExecutionHierarchy(action, action.toolMeta);
  return (
    invocationIds.has(hierarchy.parent_agent_call_id) ||
    hierarchy.parent_agent_path.some(tier => tier.call_id && invocationIds.has(tier.call_id))
  );
};
