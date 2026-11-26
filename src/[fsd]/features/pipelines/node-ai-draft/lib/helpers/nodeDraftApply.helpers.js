import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { AttachmentDiffHelpers } from '@/[fsd]/features/pipelines/tool-picker/lib/helpers';

/**
 * The pipeline YAML after Apply: the drafted node in place of the old one, plus the checked new state
 * variables. Other nodes, entry_point and interrupts are untouched; an existing variable is never replaced
 * (spec AC-24, Scope).
 */
export const applyDraftToPipeline = (yamlJsonObject, node, newState = []) => {
  const state = { ...(yamlJsonObject.state || FlowEditorConstants.DefaultState) };
  newState
    .filter(variable => variable.checked && !state[variable.name])
    .forEach(variable => {
      state[variable.name] = { type: variable.type };
    });
  return {
    ...yamlJsonObject,
    state,
    nodes: (yamlJsonObject.nodes || []).map(item => (item.id === node.id ? node : item)),
  };
};

/**
 * `version_details.tools` after Apply: the tools picked in the Flow view sandbox (a superset of the current
 * ones, or null when nothing was picked), plus the backend's attachments that aren't attached yet.
 */
export const mergeDraftTools = (current = [], sandboxTools = null, attachments = []) => {
  const tools = [...(sandboxTools || current)];
  const keys = new Set(tools.map(AttachmentDiffHelpers.getAttachmentKey));
  attachments.forEach(tool => {
    const key = AttachmentDiffHelpers.getAttachmentKey(tool);
    if (!keys.has(key)) {
      tools.push(tool);
      keys.add(key);
    }
  });
  return tools;
};
