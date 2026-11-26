import { NodeAiDraftConstants } from '@/[fsd]/features/pipelines/node-ai-draft/lib/constants';

const { NODE_AI_MODES, NODE_AI_NODE_TYPES } = NodeAiDraftConstants;

// Why the button is disabled, checked in this order (spec AC-5, AC-6)
const DISABLED_RULES = [
  [state => state.disabled, "You can't edit this pipeline"],
  [state => state.isVersionLocked, "This version can't be edited"],
  [state => state.isRunningPipeline, 'Wait for the run to finish'],
  [state => !state.llmSettings?.model_name, 'Select a model for this pipeline to use AI'],
];

const getPath = (object, path) => path.split('.').reduce((value, key) => value?.[key], object);

const hasValue = value => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return Boolean(value.trim());
  if (Array.isArray(value)) return value.length > 0;
  // tool_names: configured only when some toolkit lists a tool
  if (typeof value === 'object') return Object.values(value).some(hasValue);
  return true;
};

export const isNodeAiSupported = type => Boolean(type && NODE_AI_NODE_TYPES[type]);

export const getNodeAiMode = yamlNode => {
  const paths = NODE_AI_NODE_TYPES[yamlNode?.type]?.configPaths || [];
  return paths.some(path => hasValue(getPath(yamlNode, path)))
    ? NODE_AI_MODES.edit.key
    : NODE_AI_MODES.build.key;
};

export const getNodeAiButtonState = state => {
  if (!isNodeAiSupported(state.yamlNode?.type)) {
    return { visible: false, enabled: false, mode: NODE_AI_MODES.build.key, label: '', tooltip: '' };
  }
  const reason = DISABLED_RULES.find(([applies]) => applies(state))?.[1];
  const mode = reason ? NODE_AI_MODES.build.key : getNodeAiMode(state.yamlNode);
  const { label } = NODE_AI_MODES[mode];
  return { visible: true, enabled: !reason, mode, label, tooltip: reason || label };
};
