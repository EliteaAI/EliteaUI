import YAML from 'js-yaml';

import {
  FlowEditorConstants,
  NodePanelConstants,
} from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { DumpYamlHelpers } from '@/[fsd]/shared/lib/helpers';

import { getNodeNameError, renameNodeInYaml } from './nodeRename.helpers';

const { CONDITION_NODE_ID_SUFFIX, DECISION_NODE_ID_SUFFIX, PipelineNodeTypes } = FlowEditorConstants;
const { NODE_YAML_ERRORS } = NodePanelConstants;

// Condition and inline-decision cards have no YAML node of their own; they resolve to their owner
export const findYamlNode = (nodes = [], flowNodeId = '') => {
  const exactNode = nodes.find(node => node.id === flowNodeId);
  if (exactNode) return exactNode;

  const suffix = [CONDITION_NODE_ID_SUFFIX, DECISION_NODE_ID_SUFFIX].find(item => flowNodeId.endsWith(item));
  if (!suffix) return undefined;

  const ownerId = flowNodeId.slice(0, -suffix.length);
  return nodes.find(node => node.id === ownerId);
};

// Same text as the node's item in the full pipeline YAML, without the `nodes:` indent
export const dumpNodeYaml = yamlNode => (yamlNode ? DumpYamlHelpers.dumpYaml([yamlNode]) : '');

// Compared through the dump, so key order (which the dump sorts) doesn't count as a change
export const isSameNode = (a, b) => dumpNodeYaml(a) === dumpNodeYaml(b);

// Returns `{ node }` when the typed YAML can be applied, or `{ error }`
export const parseNodeYaml = (code, { currentNode, nodes = [], toolNames = [] }) => {
  let parsed;
  try {
    parsed = YAML.load(code || '');
  } catch (error) {
    return { error: `Invalid YAML: ${error.reason || error.message}` };
  }

  const node = Array.isArray(parsed) ? (parsed.length === 1 ? parsed[0] : undefined) : parsed;
  if (!node || typeof node !== 'object' || Array.isArray(node)) return { error: NODE_YAML_ERRORS.singleNode };

  if (node.type !== currentNode.type) return { error: NODE_YAML_ERRORS.typeChange };

  if (node.id !== currentNode.id) {
    if (currentNode.type === PipelineNodeTypes.Condition) return { error: NODE_YAML_ERRORS.renameLocked };

    const nameError = getNodeNameError({
      newName: typeof node.id === 'string' ? node.id : '',
      currentName: currentNode.id,
      nodes,
      toolNames,
    });
    if (nameError) return { error: nameError };
  }

  return { node };
};

// A changed id renames every reference first; other nodes and pipeline-level keys are kept as they are
export const applyNodeYaml = (yamlJsonObject, currentId, node) => {
  const base = node.id !== currentId ? renameNodeInYaml(yamlJsonObject, currentId, node.id) : yamlJsonObject;
  return {
    ...base,
    nodes: (base.nodes || []).map(item => (item.id === node.id ? node : item)),
  };
};
