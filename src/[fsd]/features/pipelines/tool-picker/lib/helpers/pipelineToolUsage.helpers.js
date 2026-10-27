import {
  APPLICATION_REF_NODE_TYPES,
  APPLICATION_TOOL_TYPE,
  PICKER_KINDS,
  PIPELINE_TOOL_KIND_ORDER,
  TOOL_REF_KINDS,
} from '@/[fsd]/features/pipelines/tool-picker/lib/constants/toolPicker.constants';

export const isApplicationTool = tool => tool?.type === APPLICATION_TOOL_TYPE;

// Same split as the Toolkit and MCP nodes have always used
export const isMcpAttachment = tool =>
  !isApplicationTool(tool) && Boolean(tool?.meta?.mcp || tool?.type === 'mcp');

export const getToolRefKey = (kind, name) => `${kind}:${name}`;

export const getReferencedNames = (refs, kind) =>
  new Set([...refs.values()].filter(ref => ref.kind === kind).map(ref => ref.name));

/**
 * Name a node uses to bind an attachment: agents and pipelines by `name`, toolkits and MCPs by toolkit name.
 * `getToolkitName` resolves a toolkit without `toolkit_name` (see `useGetToolkitNameFromSchema`).
 */
export const getAttachmentRefName = (tool, getToolkitName) =>
  isApplicationTool(tool) ? tool?.name : tool?.toolkit_name || getToolkitName?.(tool) || tool?.name;

export const getAttachmentRefKey = (tool, getToolkitName) =>
  getToolRefKey(
    isApplicationTool(tool) ? TOOL_REF_KINDS.application : TOOL_REF_KINDS.toolkit,
    getAttachmentRefName(tool, getToolkitName),
  );

const addReference = (refs, kind, name, nodeId, toolNames = []) => {
  if (!name || typeof name !== 'string') return;
  const key = getToolRefKey(kind, name);
  const ref = refs.get(key) || { kind, name, nodeIds: [], toolNames: new Set() };
  if (!ref.nodeIds.includes(nodeId)) ref.nodeIds.push(nodeId);
  toolNames.filter(toolName => typeof toolName === 'string' && toolName).forEach(t => ref.toolNames.add(t));
  refs.set(key, ref);
};

/**
 * Toolkits, MCPs, agents and pipelines referenced by the pipeline nodes.
 * @returns {Map<string, { kind: string, name: string, nodeIds: string[], toolNames: Set<string> }>}
 */
export const collectToolReferences = yamlJsonObject => {
  const refs = new Map();
  (yamlJsonObject?.nodes || []).forEach(node => {
    if (!node?.id) return;
    if (node.toolkit_name) {
      addReference(refs, TOOL_REF_KINDS.toolkit, node.toolkit_name, node.id, node.tool ? [node.tool] : []);
    } else if (node.tool && APPLICATION_REF_NODE_TYPES.includes(node.type)) {
      addReference(refs, TOOL_REF_KINDS.application, node.tool, node.id);
    }
    if (node.loop_toolkit_name) {
      addReference(
        refs,
        TOOL_REF_KINDS.toolkit,
        node.loop_toolkit_name,
        node.id,
        node.loop_tool ? [node.loop_tool] : [],
      );
    }
    if (node.tool_names && typeof node.tool_names === 'object') {
      Object.entries(node.tool_names).forEach(([toolkitName, toolNames]) => {
        addReference(
          refs,
          TOOL_REF_KINDS.toolkit,
          toolkitName,
          node.id,
          Array.isArray(toolNames) ? toolNames : [],
        );
      });
    }
  });
  return refs;
};

export const getAttachmentReference = (refs, tool, getToolkitName) =>
  refs.get(getAttachmentRefKey(tool, getToolkitName));

export const getAttachmentKind = tool => {
  if (isApplicationTool(tool)) {
    return tool.agent_type === 'pipeline' ? PICKER_KINDS.pipeline : PICKER_KINDS.agent;
  }
  return isMcpAttachment(tool) ? PICKER_KINDS.mcp : PICKER_KINDS.toolkit;
};

/**
 * Attachments by kind, in toolkits / MCPs / agents / pipelines order, each with the nodes that use it.
 * Empty groups are left out.
 */
export const groupAttachmentsByKind = ({
  tools = [],
  refs = new Map(),
  getToolkitName,
  hiddenKinds = [],
  hiddenToolIds = [],
}) =>
  PIPELINE_TOOL_KIND_ORDER.filter(kind => !hiddenKinds.includes(kind))
    .map(kind => ({
      kind,
      items: tools
        .filter(tool => getAttachmentKind(tool) === kind && !hiddenToolIds.includes(tool.id))
        .map(tool => ({
          key: `${getAttachmentRefKey(tool, getToolkitName)}:${tool.id ?? tool.settings?.application_id}`,
          tool,
          kind,
          usedBy: getAttachmentReference(refs, tool, getToolkitName)?.nodeIds || [],
        })),
    }))
    .filter(group => group.items.length);
