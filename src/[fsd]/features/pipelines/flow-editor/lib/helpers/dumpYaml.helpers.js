import YAML from 'js-yaml';

// Top-level keys order: States → Entry Point → Nodes (flow order)
const TOP_LEVEL_KEY_ORDER = ['state', 'entry_point', 'interrupt_after', 'interrupt_before', 'nodes'];

/**
 * Compare keys based on a priority order array
 * @param {string} a - First key
 * @param {string} b - Second key
 * @param {string[]} orderArray - Priority order array
 * @returns {number} Comparison result (-1, 0, or 1)
 */
const compareByOrder = (a, b, orderArray) => {
  const indexA = orderArray.indexOf(a);
  const indexB = orderArray.indexOf(b);

  // Both keys are in the order list
  if (indexA !== -1 && indexB !== -1) {
    return indexA - indexB;
  }

  // Only first key is in the list - it comes first
  if (indexA !== -1) {
    return -1;
  }

  // Only second key is in the list - it comes first
  if (indexB !== -1) {
    return 1;
  }

  // Neither key is in the list - sort alphabetically
  return a.localeCompare(b);
};

/**
 * Check if a value is serializable (safe for YAML dump)
 * @param {*} value - Value to check
 * @returns {boolean} True if value is serializable
 */
const isSerializable = value => {
  const type = typeof value;
  // Functions and symbols cannot be serialized by YAML
  return type !== 'function' && type !== 'symbol';
};

/**
 * Recursively reorder node objects to have id and type first
 * @param {*} obj - Object to process
 * @returns {*} Processed object with reordered keys
 */
const reorderNodeKeys = obj => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => reorderNodeKeys(item));
  }

  // Check if this object looks like a node (has both id and type)
  if ('id' in obj && 'type' in obj) {
    const reordered = {};

    // Add id first (if serializable)
    if (isSerializable(obj.id)) {
      reordered.id = obj.id;
    }

    // Add type second (if serializable)
    if (isSerializable(obj.type)) {
      reordered.type = obj.type;
    }

    // Add all other keys, recursively processing nested objects
    Object.keys(obj).forEach(key => {
      if (key !== 'id' && key !== 'type') {
        const value = obj[key];
        // Skip non-serializable values
        if (isSerializable(value)) {
          reordered[key] = reorderNodeKeys(value);
        }
      }
    });

    return reordered;
  }

  // For non-node objects, recursively process values but keep original key order
  const processed = {};
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    // Skip non-serializable values
    if (isSerializable(value)) {
      processed[key] = reorderNodeKeys(value);
    }
  });

  return processed;
};

/**
 * Custom key sorting function for YAML dump
 * Handles top-level key ordering and preserves node key order
 */
const sortYamlKeys = (a, b) => {
  // Priority fields that should come first in nodes
  const nodePriorityFields = ['id', 'type'];

  // Check if we're comparing node priority fields
  const aIsPriority = nodePriorityFields.includes(a);
  const bIsPriority = nodePriorityFields.includes(b);

  // If both are priority fields, maintain their order
  if (aIsPriority && bIsPriority) {
    return nodePriorityFields.indexOf(a) - nodePriorityFields.indexOf(b);
  }

  // If only 'a' is a priority field, it comes first
  if (aIsPriority) {
    return -1;
  }

  // If only 'b' is a priority field, it comes first
  if (bIsPriority) {
    return 1;
  }

  // For non-priority fields, check if they're top-level keys
  return compareByOrder(a, b, TOP_LEVEL_KEY_ORDER);
};

/**
 * Dump data to YAML format with custom key ordering
 * @param {Object} data - Data to convert to YAML
 * @returns {string} YAML string
 */
export const dumpYaml = data => {
  try {
    // Preprocess to reorder node keys (id and type first)
    const processedData = reorderNodeKeys(data);

    return YAML.dump(processedData, {
      lineWidth: -1, // Prevent line wrapping
      sortKeys: sortYamlKeys,
      noCompatMode: true, // Preserve key order better
    });
  } catch (error) {
    // Add context to the error message
    return `Error dumping YAML: ${error.message}`;
  }
};
