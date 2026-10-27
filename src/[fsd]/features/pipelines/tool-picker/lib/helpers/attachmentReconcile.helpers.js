import { getAttachmentKey, isSameToolSet } from './attachmentDiff.helpers';
import { getToolkitAvailableTools } from './attachmentTool.helpers';
import {
  collectToolReferences,
  getAttachmentReference,
  isApplicationTool,
} from './pipelineToolUsage.helpers';

const getDesiredSelectedTools = ({ tool, initialTool, ref, initialRef }) => {
  const usedTools = [...ref.toolNames].sort();
  const initiallyUsedTools = initialRef ? [...initialRef.toolNames].sort() : [];

  // Same usage as when the version was loaded: keep what is saved, so a no-op Save sends nothing
  if (initialTool && isSameToolSet(usedTools, initiallyUsedTools)) {
    return initialTool.settings?.selected_tools;
  }
  if (usedTools.length) return usedTools;
  return initialTool ? initialTool.settings?.selected_tools : getToolkitAvailableTools(tool);
};

/**
 * Keeps `version_details.tools` in line with the nodes. Pure and idempotent.
 * - Drops an attachment no node references any more, when a node referenced it on load or it was added
 *   in this session. Attachments no node ever used (legacy) are left alone.
 * - Narrows a toolkit's `selected_tools` to the tools its nodes use, only when that usage changed.
 * @returns the same `tools` array when nothing changes
 */
export const reconcileAttachments = ({
  tools = [],
  initialTools = [],
  yamlJsonObject,
  initialYamlJsonObject,
  getToolkitName,
}) => {
  const refs = collectToolReferences(yamlJsonObject);
  const initialRefs = collectToolReferences(initialYamlJsonObject);
  const initialByKey = new Map((initialTools || []).map(tool => [getAttachmentKey(tool), tool]));

  let changed = false;
  const next = [];

  (tools || []).forEach(tool => {
    const ref = getAttachmentReference(refs, tool, getToolkitName);
    const initialTool = initialByKey.get(getAttachmentKey(tool));
    const initialRef = initialTool
      ? getAttachmentReference(initialRefs, initialTool, getToolkitName)
      : undefined;

    if (!ref) {
      if (!initialTool || initialRef) {
        changed = true;
        return;
      }
      next.push(tool);
      return;
    }

    if (isApplicationTool(tool)) {
      next.push(tool);
      return;
    }

    const desired = getDesiredSelectedTools({ tool, initialTool, ref, initialRef });
    if (desired !== undefined && !isSameToolSet(desired, tool.settings?.selected_tools)) {
      changed = true;
      next.push({ ...tool, settings: { ...(tool.settings || {}), selected_tools: desired } });
      return;
    }
    next.push(tool);
  });

  return changed ? next : tools;
};
