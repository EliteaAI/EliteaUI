import { getAttachmentRefName, isApplicationTool } from './pipelineToolUsage.helpers';

export const DUPLICATE_NAME_REASON = name =>
  `Another toolkit is also named "${name}". Nodes bind toolkits by name, so rename one of them to use it.`;

export const INTERRUPT_REASON = name =>
  `The ${name} pipeline can't be used as it contains interruptions in subgraphs, which are not allowed.`;

export const SWARM_REASON = name =>
  `The ${name} agent has Swarm Mode enabled and can't be added as a tool. Swarm agents are only supported in direct chat.`;

export const NESTING_REASON = (name, maxTiers) =>
  `The default version of ${name} nests agents too deeply: agent nesting is limited to ${maxTiers} tiers ` +
  '(orchestrator → sub-orchestrator → leaf). Make a shallower version its default to add it.';

/**
 * Whether adding this list row would pass the nesting limit. Same rule as the add guard in
 * useAgentPipelineAssociation (the edited entity is tier 1): rows without the backend's tier
 * fields are never blocked here, the backend check on add stays authoritative.
 * @returns {string} the reason, or '' when it fits
 */
export const getNestingDisabledReason = row => {
  const { agent_subtree_tiers: subtreeTiers, max_agent_nesting_tiers: maxTiers } = row;
  const exceeds =
    typeof subtreeTiers === 'number' && typeof maxTiers === 'number' && 1 + subtreeTiers > maxTiers;
  return exceeds ? NESTING_REASON(row.name, maxTiers) : '';
};

const matchesQuery = (item, query) => {
  const text = (query || '').trim().toLowerCase();
  if (!text) return true;
  return [item.label, item.name].some(value => value?.toLowerCase().includes(text));
};

/**
 * Picker items for toolkits or MCPs. Toolkits used by the pipeline nodes come first (from the attachments,
 * so they show even when not loaded yet); a toolkit whose name another toolkit already has is disabled.
 * @param {object} params
 * @param {object[]} params.rows project list rows
 * @param {object[]} params.attachedTools `version_details.tools` of this kind (toolkits or MCPs)
 * @param {Set<string>} params.usedNames toolkit names the nodes reference
 */
export const buildToolkitPickerItems = ({
  rows = [],
  attachedTools = [],
  usedNames = new Set(),
  query = '',
  getToolkitName,
  getLabel = source => source.name,
}) => {
  const toItem = (source, isAttached) => {
    const name = getAttachmentRefName(source, getToolkitName);
    return {
      key: `toolkit:${source.id}`,
      id: source.id,
      name,
      label: getLabel(source) || name,
      description: source.description || '',
      source,
      isAttached,
      inUse: usedNames.has(name),
      disabledReason: '',
    };
  };

  const ownerIdByName = new Map();
  const claimName = item => {
    const ownerId = ownerIdByName.get(item.name);
    if (ownerId === undefined) {
      ownerIdByName.set(item.name, item.id);
      return true;
    }
    return ownerId === item.id;
  };

  const attachedItems = attachedTools
    .filter(tool => !isApplicationTool(tool))
    .map(tool => toItem(tool, true));
  attachedItems.forEach(claimName);
  const attachedIds = new Set(attachedItems.map(item => item.id));

  const pinned = attachedItems.filter(item => item.inUse && matchesQuery(item, query));
  const listed = rows
    .filter(row => !attachedIds.has(row.id) || !usedNames.has(getAttachmentRefName(row, getToolkitName)))
    .map(row => {
      const item = { ...toItem(row, attachedIds.has(row.id)), inUse: false };
      return claimName(item) ? item : { ...item, disabledReason: DUPLICATE_NAME_REASON(item.name) };
    });

  return [...pinned, ...listed];
};

export const DUPLICATE_APPLICATION_NAME_REASON = name =>
  `The pipeline already uses another agent or pipeline named "${name}". Nodes bind them by name, so rename one of them to use it.`;

/**
 * Picker items for agents or pipelines; the pipeline being edited is left out and swarm agents are disabled.
 * @param {object[]} params.attachedTools attached `application` tools of this kind
 * @param {object[]} params.allAttachedTools every attached `application` tool, agents and pipelines alike
 */
export const buildApplicationPickerItems = ({
  rows = [],
  attachedTools = [],
  allAttachedTools = attachedTools,
  usedNames = new Set(),
  query = '',
  excludeId,
}) => {
  const attachedIdByName = new Map(
    allAttachedTools.filter(isApplicationTool).map(tool => [tool.name, tool.settings?.application_id]),
  );
  const getDisabledReason = row => {
    if (row.has_interrupt) return INTERRUPT_REASON(row.name);
    if (row.has_swarm) return SWARM_REASON(row.name);
    const nestingReason = getNestingDisabledReason(row);
    if (nestingReason) return nestingReason;
    const attachedId = attachedIdByName.get(row.name);
    return attachedId !== undefined && attachedId !== row.id
      ? DUPLICATE_APPLICATION_NAME_REASON(row.name)
      : '';
  };

  const pinned = attachedTools
    .filter(tool => isApplicationTool(tool) && usedNames.has(tool.name))
    .map(tool => ({
      key: `application:${tool.settings?.application_id}`,
      id: tool.settings?.application_id,
      name: tool.name,
      label: tool.name,
      description: tool.description || '',
      iconMeta: tool.icon_meta,
      source: tool,
      isAttached: true,
      inUse: true,
      disabledReason: '',
    }))
    .filter(item => matchesQuery(item, query));
  const pinnedIds = new Set(pinned.map(item => item.id));

  const listed = rows
    .filter(row => row.id !== excludeId && !pinnedIds.has(row.id))
    .map(row => ({
      key: `application:${row.id}`,
      id: row.id,
      name: row.name,
      label: row.name,
      description: row.description || '',
      iconMeta: row.icon_meta,
      source: row,
      isAttached: false,
      inUse: false,
      disabledReason: getDisabledReason(row),
    }));

  return [...pinned, ...listed];
};
