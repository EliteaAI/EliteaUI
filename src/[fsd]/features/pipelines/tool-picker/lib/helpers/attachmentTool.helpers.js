import { APPLICATION_TOOL_TYPE } from '@/[fsd]/features/pipelines/tool-picker/lib/constants/toolPicker.constants';

/**
 * A toolkit or MCP entry for `version_details.tools`, shaped like the one `useAssociateToolkit` adds.
 * `toolkitName` must be the name the node writes into `toolkit_name`, so the two stay bound.
 */
export const buildToolkitAttachment = (toolkit, { mcp = false, toolkitName } = {}) => ({
  id: toolkit.id,
  type: toolkit.type || 'custom',
  name: toolkit.name || toolkitName || toolkit.type || 'New Toolkit',
  description: toolkit.description || '',
  settings: {
    ...(toolkit.settings || {}),
    available_tools: toolkit.settings?.selected_tools || [],
  },
  toolkit_name: toolkitName || toolkit.toolkit_name || toolkit.name,
  online: toolkit.online,
  meta: { mcp },
  ...(toolkit.icon_meta ? { icon_meta: toolkit.icon_meta } : {}),
  author: toolkit.author || {},
  author_id: toolkit.author?.id,
});

/** An agent or pipeline entry, shaped like the one `useAgentPipelineAssociation` adds. No tool id until Save. */
export const buildApplicationAttachment = (application, versionDetails = application?.version_details) => ({
  type: APPLICATION_TOOL_TYPE,
  name: application.name,
  description: application.description || '',
  agent_type: versionDetails?.agent_type,
  icon_meta: versionDetails?.icon_meta || {},
  settings: {
    application_id: application.id,
    application_version_id: versionDetails?.id,
  },
  author: versionDetails?.author || {},
  author_id: versionDetails?.author?.id,
  variables: (versionDetails?.variables || []).map(({ name, value }) => ({ name, value })),
});

export const withApplicationVersion = (tool, versionDetails) => ({
  ...tool,
  ...(versionDetails?.icon_meta ? { icon_meta: versionDetails.icon_meta } : {}),
  settings: {
    ...(tool.settings || {}),
    application_version_id: versionDetails?.id,
  },
});

/** Tools a toolkit offers, before the pipeline narrows `selected_tools` to the ones its nodes use */
export const getToolkitAvailableTools = tool => {
  const available = tool?.settings?.available_tools;
  if (Array.isArray(available) && available.length) return available;
  return Array.isArray(tool?.settings?.selected_tools) ? tool.settings.selected_tools : [];
};

/** Page of an attached item, the same the agent tool card opens */
export const getAttachmentPagePath = tool => {
  if (tool?.type === APPLICATION_TOOL_TYPE) {
    const applicationId = tool.settings?.application_id;
    if (!applicationId) return null;
    const section = tool.agent_type === 'pipeline' ? 'pipelines' : 'agents';
    const versionId = tool.settings?.application_version_id;
    return `/${section}/all/${applicationId}${versionId ? `/${versionId}` : ''}`;
  }
  if (!tool?.id) return null;
  const isMcp = Boolean(tool.meta?.mcp || tool.type === 'mcp');
  return `/${isMcp ? 'mcps' : 'toolkits'}/all/${tool.id}`;
};
