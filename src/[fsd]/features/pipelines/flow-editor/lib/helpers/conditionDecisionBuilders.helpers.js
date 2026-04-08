import { addTargetToArray } from './nodeOperations.helpers';

/**
 * Generic builder for condition/decision structures
 * @param {object} yamlNode - The YAML node
 * @param {object} connection - The connection object
 * @param {string} propertyName - The property name ('condition' or 'decision')
 * @param {string} arrayHandle - The handle name for array updates ('conditional_outputs' or 'nodes')
 * @param {string} arrayKey - The key for array updates ('conditional_outputs' or 'nodes')
 */
const buildNewStructure = (yamlNode, connection, propertyName, arrayHandle, arrayKey) => {
  const isArrayHandle = connection.sourceHandle === arrayHandle;
  const baseStructure = yamlNode?.[propertyName] || {};

  if (isArrayHandle) {
    return {
      ...baseStructure,
      [arrayKey]: addTargetToArray(baseStructure[arrayKey], connection.target),
    };
  }

  return {
    ...baseStructure,
    default_output: connection.target,
  };
};

export const buildNewCondition = (yamlNode, connection) => {
  return buildNewStructure(yamlNode, connection, 'condition', 'conditional_outputs', 'conditional_outputs');
};

export const buildNewDecision = (yamlNode, connection) => {
  return buildNewStructure(yamlNode, connection, 'decision', 'nodes', 'nodes');
};
