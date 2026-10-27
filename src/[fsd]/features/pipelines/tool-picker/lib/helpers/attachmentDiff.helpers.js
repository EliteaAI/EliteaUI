import { isApplicationTool } from './pipelineToolUsage.helpers';

/** Identity of an attachment across saves: the toolkit id, or the agent/pipeline id (a new one has no tool id yet) */
export const getAttachmentKey = tool =>
  isApplicationTool(tool) ? `application:${tool?.settings?.application_id}` : `toolkit:${tool?.id}`;

export const isSameToolSet = (a, b) => {
  const left = Array.isArray(a) ? a : [];
  const right = Array.isArray(b) ? b : [];
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  return left.every(item => rightSet.has(item));
};

/**
 * What Save must apply to the backend relations, keyed by attachment identity (not by list index).
 */
export const diffAttachments = (initialTools = [], currentTools = []) => {
  const initialByKey = new Map((initialTools || []).map(tool => [getAttachmentKey(tool), tool]));
  const currentByKey = new Map((currentTools || []).map(tool => [getAttachmentKey(tool), tool]));

  const added = [];
  const selectedToolsChanged = [];
  const versionChanged = [];

  currentByKey.forEach((tool, key) => {
    const initialTool = initialByKey.get(key);
    if (!initialTool) {
      added.push(tool);
    } else if (isApplicationTool(tool)) {
      if (tool.settings?.application_version_id !== initialTool.settings?.application_version_id) {
        versionChanged.push({ tool, initialTool });
      }
    } else if (!isSameToolSet(tool.settings?.selected_tools, initialTool.settings?.selected_tools)) {
      selectedToolsChanged.push(tool);
    }
  });

  const removed = [...initialByKey.entries()]
    .filter(([key]) => !currentByKey.has(key))
    .map(([, tool]) => tool);

  return {
    added,
    removed,
    selectedToolsChanged,
    versionChanged,
    hasChanges: Boolean(
      added.length || removed.length || selectedToolsChanged.length || versionChanged.length,
    ),
  };
};
