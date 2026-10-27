import { getAttachmentRefName, isApplicationTool } from './pipelineToolUsage.helpers';

export const DUPLICATE_NAME_REASON = name =>
  `Another toolkit is also named "${name}". Nodes bind toolkits by name, so rename one of them to use it.`;

export const INTERRUPT_REASON = name =>
  `The ${name} pipeline can't be used as it contains interruptions in subgraphs, which are not allowed.`;

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

/**
 * Picker items for agents or pipelines; the pipeline being edited and swarm agents are left out.
 * @param {object[]} params.attachedTools attached `application` tools of this kind
 */
export const buildApplicationPickerItems = ({
  rows = [],
  attachedTools = [],
  usedNames = new Set(),
  query = '',
  excludeId,
}) => {
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
    .filter(row => row.id !== excludeId && !row.has_swarm && !pinnedIds.has(row.id))
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
      disabledReason: row.has_interrupt ? INTERRUPT_REASON(row.name) : '',
    }));

  return [...pinned, ...listed];
};
