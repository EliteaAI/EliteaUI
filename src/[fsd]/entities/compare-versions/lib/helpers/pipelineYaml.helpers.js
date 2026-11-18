import YAML from 'js-yaml';

export const YAML_ERRORS = {
  empty: 'YAML is empty. A pipeline needs at least `nodes`.',
  notMapping: 'YAML is not valid: the pipeline must be a mapping of keys and values.',
  multipleDocuments: 'YAML is not valid: use a single document.',
  syntax: line => `YAML is not valid. Check line ${line}.`,
};

const isPlainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

const syntaxError = error => YAML_ERRORS.syntax((error?.mark?.line ?? 0) + 1);

/**
 * The client mirror of the backend rule (`validate_yaml_from_str`): one YAML document that parses to a
 * mapping. Missing `nodes` or duplicate node ids are accepted, as the backend accepts them.
 * @returns {{ valid: boolean, message: string }}
 */
export const validatePipelineYaml = text => {
  if (!text?.trim()) return { valid: false, message: YAML_ERRORS.empty };

  let documents;
  try {
    documents = YAML.loadAll(text);
  } catch (error) {
    return { valid: false, message: syntaxError(error) };
  }

  if (documents.length > 1) return { valid: false, message: YAML_ERRORS.multipleDocuments };
  // Only comments or whitespace load as no document, or as one null document
  if (!documents.length || documents[0] === null || documents[0] === undefined) {
    return { valid: false, message: YAML_ERRORS.empty };
  }
  if (!isPlainObject(documents[0])) return { valid: false, message: YAML_ERRORS.notMapping };

  return { valid: true, message: '' };
};

const parseMapping = text => {
  try {
    const parsed = YAML.load(text || '');
    return isPlainObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

/** Deep equality of parsed YAML values; key order is ignored, list order is kept. */
export const isYamlValueEqual = (left, right) => {
  if (left === right) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false;
    return left.every((item, index) => isYamlValueEqual(item, right[index]));
  }
  if (left instanceof Date && right instanceof Date) return left.getTime() === right.getTime();
  if (!isPlainObject(left) || !isPlainObject(right)) return false;
  const leftKeys = Object.keys(left);
  if (leftKeys.length !== Object.keys(right).length) return false;
  return leftKeys.every(
    key => Object.prototype.hasOwnProperty.call(right, key) && isYamlValueEqual(left[key], right[key]),
  );
};

const hasNodeId = node => isPlainObject(node) && (typeof node.id === 'string' || typeof node.id === 'number');

// Nodes without an id are not counted; a repeated id makes the summary unavailable
const indexNodes = nodes => {
  const byId = new Map();
  for (const node of nodes) {
    if (!hasNodeId(node)) continue;
    const id = String(node.id);
    if (byId.has(id)) return { duplicateId: id };
    byId.set(id, node);
  }
  return { byId };
};

/**
 * Compares the top-level `nodes` list of two pipeline YAML texts by node id.
 * @returns {null | { error: string } | { added: string[], removed: string[], changed: string[] }}
 *   null when either side doesn't parse to a mapping or has no `nodes` list
 */
export const buildNodeSummary = (leftYaml, rightYaml) => {
  const left = parseMapping(leftYaml);
  const right = parseMapping(rightYaml);
  if (!left || !right || !Array.isArray(left.nodes) || !Array.isArray(right.nodes)) return null;

  const leftIndex = indexNodes(left.nodes);
  const rightIndex = indexNodes(right.nodes);
  const duplicateId = leftIndex.duplicateId ?? rightIndex.duplicateId;
  if (duplicateId !== undefined)
    return { error: `Node summary unavailable: duplicate node id ${duplicateId}` };

  const added = [...rightIndex.byId.keys()].filter(id => !leftIndex.byId.has(id));
  const removed = [...leftIndex.byId.keys()].filter(id => !rightIndex.byId.has(id));
  const changed = [...leftIndex.byId.keys()].filter(
    id => rightIndex.byId.has(id) && !isYamlValueEqual(leftIndex.byId.get(id), rightIndex.byId.get(id)),
  );

  return { added, removed, changed };
};

const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The 1-based number of the line holding `id: <nodeId>` (as a list item or a key), or null. */
export const findNodeIdLine = (text, nodeId) => {
  if (!text) return null;
  const pattern = new RegExp(`^\\s*(?:-\\s+)?id:\\s*(['"]?)${escapeRegExp(String(nodeId))}\\1\\s*(?:#.*)?$`);
  const index = text.split('\n').findIndex(line => pattern.test(line));
  return index < 0 ? null : index + 1;
};

export const countLines = text => (text ? text.split('\n').length : 0);
