import { NodeOperationsHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';

/**
 * Updates or clears a property on a YAML node
 * @param {Object} yamlNode - The YAML node to update
 * @param {string} propertyName - The name of the property to update/clear
 * @param {Object|null|undefined} updates - Updates to merge, or null/undefined to clear
 * @returns {Object} Updated YAML node with the property modified
 */
const updateYamlNodeProperty = (yamlNode, propertyName, updates) => {
  // Clear property if updates is null or undefined
  if (updates === null || updates === undefined) {
    return { ...yamlNode, [propertyName]: undefined };
  }

  // If property exists and is an object (but not an array), merge updates
  // If property doesn't exist or is an array, replace it with updates
  return {
    ...yamlNode,
    [propertyName]:
      yamlNode[propertyName] &&
      typeof yamlNode[propertyName] === 'object' &&
      !Array.isArray(yamlNode[propertyName])
        ? { ...yamlNode[propertyName], ...(updates || {}) }
        : Array.isArray(yamlNode[propertyName]) && Array.isArray(updates)
          ? [...updates]
          : updates,
  };
};

export const updateYamlNodeCondition = (yamlNode, updates) => {
  return updateYamlNodeProperty(yamlNode, 'condition', updates);
};

export const updateYamlNodeDecision = (yamlNode, updates) => {
  if (!yamlNode.decision) {
    return yamlNode;
  }
  return updateYamlNodeProperty(yamlNode, 'decision', updates);
};

export const clearYamlNodeCondition = yamlNode => {
  return updateYamlNodeProperty(yamlNode, 'condition', null);
};

export const clearYamlNodeDecision = yamlNode => {
  return updateYamlNodeProperty(yamlNode, 'decision', null);
};

export const updateYamlNodeTransition = (yamlNode, transition) => ({
  ...yamlNode,
  transition,
});

export const removeInterruptReferences = (yamlJsonObject, nodeId) => {
  const result = { ...yamlJsonObject };
  if (result.interrupt_after) {
    result.interrupt_after = NodeOperationsHelpers.removeNodeIdFromArray(result.interrupt_after, nodeId);
  }
  if (result.interrupt_before) {
    result.interrupt_before = NodeOperationsHelpers.removeNodeIdFromArray(result.interrupt_before, nodeId);
  }
  return result;
};
