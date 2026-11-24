import { deepClone } from '@mui/x-data-grid/internals';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';

const { PipelineNodeTypes } = FlowEditorConstants;

const withoutSpaces = value => value.replace(/\s/g, '');

/**
 * Returns the reason `newName` can't be used for the node `currentName`, or null.
 * Names are compared ignoring spaces, so "llm 1" clashes with "llm1".
 */
export const getNodeNameError = ({ newName, currentName, nodes = [], toolNames = [] }) => {
  if (!newName?.trim()) return 'Name is required';
  if (newName === currentName) return null;

  const foundNodeName = nodes.find(
    node => node.id !== currentName && withoutSpaces(node.id) === withoutSpaces(newName),
  );
  if (foundNodeName) return 'The name has been used by other nodes, please input a new name!';

  const foundToolName = toolNames.find(toolName => withoutSpaces(toolName) === withoutSpaces(newName));
  if (foundToolName) {
    return `The name conflicts with an existing toolkit name "${foundToolName}", please input a new name!`;
  }

  return null;
};

const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Replaces the node name only where it is a whole word, so "llm_1" inside "my_llm_1" or "llm_10" is kept
const renameNodeInText = (text, name, newName) =>
  typeof text === 'string' && typeof name === 'string'
    ? text.replace(new RegExp(`(?<![\\w])${escapeRegExp(name)}(?![\\w])`, 'g'), () => newName)
    : text;

// Jinja tags: {{ expression }}, {% statement %} and {# comment #}. The text between them is rendered as it is.
const JINJA_TAG_PATTERN = /(\{\{[\s\S]*?\}\}|\{%[\s\S]*?%\}|\{#[\s\S]*?#\})/;
const JINJA_STRING_LITERAL_PATTERN = /(['"])((?:\\.|(?!\1)[^\\])*)\1/g;

// A node name in a Jinja template is a value: text the template renders, or a string literal in a tag.
// A bare name inside a tag reads a state variable, so it is kept.
const renameNodeInJinja = (template, name, newName) => {
  if (typeof template !== 'string') return template;

  return template
    .split(JINJA_TAG_PATTERN)
    .map((part, index) => {
      // split() keeps the tags at the odd indexes
      if (index % 2 === 0) return renameNodeInText(part, name, newName);
      return part.replace(JINJA_STRING_LITERAL_PATTERN, (literal, quote, content) =>
        content === name ? `${quote}${newName}${quote}` : literal,
      );
    })
    .join('');
};

export const renameNodeInYaml = (prev, name, newName) => {
  const newNodes = [...(prev?.nodes || [])].map(node => {
    const newNode = node.id === name ? { ...node, id: newName } : { ...node };
    if (node.type !== PipelineNodeTypes.Router) {
      if (node.condition) {
        newNode.condition = {
          ...node.condition,
          condition_definition: renameNodeInJinja(node.condition.condition_definition, name, newName),
          conditional_outputs: node.condition.conditional_outputs?.map(item =>
            item === name ? newName : item,
          ),
          default_output: node.condition.default_output === name ? newName : node.condition.default_output,
        };
      } else if (node.decision) {
        newNode.decision = {
          ...node.decision,
          nodes: node.decision.nodes?.map(item => (item === name ? newName : item)),
          default_output: node.decision.default_output === name ? newName : node.decision.default_output,
        };
      } else if (node.type === PipelineNodeTypes.Decision) {
        newNode.nodes = node.nodes?.map(item => (item === name ? newName : item));
        newNode.default_output = node.default_output === name ? newName : node.default_output;
      } else if (node.type === PipelineNodeTypes.Hitl) {
        // routes belongs to the Redux state (frozen by Immer), so build a new object instead of assigning into it
        if (node.routes) {
          newNode.routes = {
            ...node.routes,
            approve: node.routes.approve === name ? newName : node.routes.approve,
            edit: node.routes.edit === name ? newName : node.routes.edit,
            reject: node.routes.reject === name ? newName : node.routes.reject,
          };
        }
      }
      // The runtime follows a transition even when the node also has an inline condition or decision
      if (node.transition === name) newNode.transition = newName;
    } else {
      newNode.condition = renameNodeInJinja(node.condition, name, newName);
      newNode.routes = node.routes?.map(item => (item === name ? newName : item));
      newNode.default_output = node.default_output === name ? newName : node.default_output;
    }

    return newNode;
  });
  return {
    ...(prev || {}),
    entry_point: prev.entry_point === name ? newName : prev.entry_point,
    nodes: newNodes,
    interrupt_before: Array.isArray(prev.interrupt_before)
      ? prev.interrupt_before?.map(item => (item === name ? newName : item))
      : prev.interrupt_before,
    interrupt_after: Array.isArray(prev.interrupt_after)
      ? prev.interrupt_after?.map(item => (item === name ? newName : item))
      : prev.interrupt_after,
  };
};

// Key order carries no meaning in YAML maps (the YAML view sorts keys), but array order does
const isSameValue = (left, right) => {
  if (left === right) return true;
  if (!left || !right || typeof left !== 'object' || typeof right !== 'object') return false;
  if (Array.isArray(left) !== Array.isArray(right)) return false;
  if (Array.isArray(left))
    return left.length === right.length && left.every((item, index) => isSameValue(item, right[index]));
  return [...new Set([...Object.keys(left), ...Object.keys(right)])].every(key =>
    isSameValue(left[key], right[key]),
  );
};

// An id left empty or typed as a number in the YAML is not a node name yet, so it can't be renamed from or to
const isNodeName = id => typeof id === 'string' && id.trim() !== '';

/**
 * Finds the nodes renamed by a YAML edit: same position and type, the old id is gone, the new id is unused
 * and the rest of the node is unchanged. Added, removed, swapped or replaced nodes are not renames, so they are left out.
 * Returns `[[oldId, newId], ...]`.
 */
export const getRenamedNodePairs = (prevNodes, nextNodes) => {
  if (!Array.isArray(prevNodes) || !Array.isArray(nextNodes) || prevNodes.length !== nextNodes.length)
    return [];

  const prevIds = new Set(prevNodes.map(node => node?.id));
  const nextIds = new Set(nextNodes.map(node => node?.id));

  return prevNodes.reduce((pairs, prevNode, index) => {
    const nextNode = nextNodes[index];
    if (!prevNode || !nextNode || prevNode.id === nextNode.id || prevNode.type !== nextNode.type)
      return pairs;
    if (!isNodeName(prevNode.id) || !isNodeName(nextNode.id)) return pairs;
    if (nextIds.has(prevNode.id) || prevIds.has(nextNode.id)) return pairs;
    if (!isSameValue({ ...prevNode, id: undefined }, { ...nextNode, id: undefined })) return pairs;
    return [...pairs, [prevNode.id, nextNode.id]];
  }, []);
};

// Applies the renames to the pipeline YAML, so references to the old ids follow the nodes
export const applyNodeRenamesToYaml = (yamlJson, renamedPairs = []) =>
  renamedPairs.reduce((result, [oldId, newId]) => renameNodeInYaml(result, oldId, newId), yamlJson);

export const renameNodeInFlowNodes = (prevNodes, name, newName) =>
  prevNodes.map(node => {
    const clonedNode = deepClone(node);
    const newNode =
      clonedNode.id === name
        ? { ...clonedNode, id: newName, data: { ...clonedNode.data, label: newName } }
        : { ...clonedNode };
    if (clonedNode.data.condition) {
      newNode.data.condition = {
        ...clonedNode.data.condition,
        condition_definition: renameNodeInJinja(
          clonedNode.data.condition.condition_definition,
          name,
          newName,
        ),
        conditional_outputs: clonedNode.data.condition.conditional_outputs?.map(item =>
          item === name ? newName : item,
        ),
        default_output:
          clonedNode.data.condition.default_output === name
            ? newName
            : clonedNode.data.condition.default_output,
      };
    } else if (newNode.data.decision) {
      newNode.data.decision = {
        ...clonedNode.data.decision,
        nodes: clonedNode.data.decision.nodes?.map(item => (item === name ? newName : item)),
        default_output:
          clonedNode.data.decision.default_output === name
            ? newName
            : clonedNode.data.decision.default_output,
      };
    } else if (clonedNode.data.type === PipelineNodeTypes.Decision) {
      newNode.data.nodes = clonedNode.data.nodes?.map(item => (item === name ? newName : item));
      newNode.data.default_output =
        clonedNode.data.default_output === name ? newName : clonedNode.data.default_output;
    }
    return newNode;
  });

export const renameNodeInEdges = (prevEdges, name, newName) =>
  prevEdges.map(edge =>
    edge.source === name
      ? { ...edge, source: newName }
      : edge.target === name
        ? { ...edge, target: newName }
        : edge,
  );
