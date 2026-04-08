import { FlowEditorConstants, StateDrawerConstants, ValidationErrors } from '../constants';

/**
 * Calculate dynamic name field width based on drawer width
 * Uses linear interpolation between breakpoints for smooth transitions
 * @param {number} drawerWidth - Current drawer width in pixels
 * @returns {number} - Calculated name field width in pixels
 */
export const calculateNameFieldWidth = drawerWidth => {
  if (drawerWidth >= StateDrawerConstants.DRAWER_BREAKPOINT_EXPANDED) {
    return StateDrawerConstants.NAME_FIELD_WIDTH_EXPANDED;
  }
  const minWidth = StateDrawerConstants.NAME_FIELD_WIDTH_NARROW;
  const maxWidth = StateDrawerConstants.NAME_FIELD_WIDTH_EXPANDED;
  const minDrawerWidth = StateDrawerConstants.MIN_DRAWER_WIDTH;
  const maxDrawerWidth = StateDrawerConstants.DRAWER_BREAKPOINT_EXPANDED;
  const ratio = (drawerWidth - minDrawerWidth) / (maxDrawerWidth - minDrawerWidth);
  return Math.round(minWidth + ratio * (maxWidth - minWidth));
};

export const getDefaultValueForType = type => {
  switch (type) {
    case FlowEditorConstants.StateVariableTypes.String:
      return '';
    case FlowEditorConstants.StateVariableTypes.Number:
      return 0;
    case FlowEditorConstants.StateVariableTypes.List:
      return [];
    case FlowEditorConstants.StateVariableTypes.Json:
      return {};
    default:
      return '';
  }
};

export const getValueByType = (name, type, value) => {
  switch (type) {
    case FlowEditorConstants.StateVariableTypes.String:
      return name !== FlowEditorConstants.STATE_INPUT || value ? value : undefined;
    case FlowEditorConstants.LegacyIntType:
      // Handle different input types for legacy integers
      if (typeof value === 'number') return Math.floor(value); // Ensure integer
      if (typeof value === 'string') {
        const parsed = parseInt(value.trim(), 10);
        return isNaN(parsed) ? value : parsed;
      }
      return value;
    case FlowEditorConstants.StateVariableTypes.Number:
      // Handle different input types for numbers
      if (typeof value === 'number') return value;
      if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value.trim());
        return isNaN(parsed) ? value : parsed;
      }
      return value;
    case FlowEditorConstants.StateVariableTypes.List:
      try {
        return JSON.parse(value);
      } catch {
        return name !== FlowEditorConstants.STATE_MESSAGES ? [] : undefined;
      }
    case FlowEditorConstants.StateVariableTypes.Json:
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    default:
      return value;
  }
};

export const getMessagesFromState = states =>
  states?.[FlowEditorConstants.STATE_MESSAGES]?.value
    ? JSON.stringify(states[FlowEditorConstants.STATE_MESSAGES]?.value, null, 2)
    : [];

export const validateVariableName = (name, excludeName = null, states) => {
  if (!name) return '';
  // Allow the current name when editing (excludeName)
  if (states?.[name] && name !== excludeName) return ValidationErrors.VariableNameExists;
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name)) {
    return ValidationErrors.VariableNameInvalid;
  }
  return '';
};

export const validateValueByType = (type, value) => {
  // Skip validation for undefined or empty string (optional value)
  if (value === undefined || value === '') {
    return '';
  }
  switch (type) {
    case FlowEditorConstants.StateVariableTypes.Number:
      if (isNaN(Number(value))) {
        return ValidationErrors.NumberFormatInvalid;
      } else {
        return '';
      }
    case FlowEditorConstants.StateVariableTypes.List:
      // If it's already an array, it's valid
      if (Array.isArray(value)) {
        return '';
      }
      // If it's a string, try to parse it as JSON
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (!Array.isArray(parsed)) {
            return ValidationErrors.ListFormatInvalid;
          }
          return '';
        } catch {
          return ValidationErrors.ListFormatInvalid;
        }
      }
      // Any other type is invalid
      return ValidationErrors.ListFormatInvalid;
    case FlowEditorConstants.StateVariableTypes.Json:
      // If value is already an object, validate it directly
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          return ValidationErrors.JsonFormatInvalid;
        }
        return '';
      }
      // If value is a string, try to parse it
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (typeof parsed !== 'object' || Array.isArray(parsed)) {
            return ValidationErrors.JsonFormatInvalid;
          }
          return '';
        } catch {
          return ValidationErrors.JsonFormatInvalid;
        }
      }
      // Any other type is invalid
      return ValidationErrors.JsonFormatInvalid;
    default:
      return '';
  }
};

export const convertValueByType = (type, value) => {
  // For List and Json types, check if value is already a string (possibly invalid input)
  // If it's a string, return as-is to preserve user input and show validation errors
  if (type === FlowEditorConstants.StateVariableTypes.List) {
    if (typeof value === 'string') {
      return value; // Return raw string (may be invalid JSON)
    }
    return JSON.stringify(value); // Stringify valid array
  }

  if (type === FlowEditorConstants.StateVariableTypes.Json) {
    if (typeof value === 'string') {
      return value; // Return raw string (may be invalid JSON)
    }
    return JSON.stringify(value, null, 2); // Stringify valid object
  }

  if (type === FlowEditorConstants.StateVariableTypes.Number || type === FlowEditorConstants.LegacyIntType) {
    return String(value);
  }

  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }

  return JSON.stringify(value, null, 2);
};

/**
 * Format state variables for AI prompt context
 * Extracts variable names and types from pipeline state
 * @param {Object} state - The pipeline state object (yamlJsonObject.state)
 * @returns {string} - Formatted string of state variables for prompt injection
 */
export const formatStateVariablesForPrompt = state => {
  if (!state || typeof state !== 'object') {
    return '';
  }

  const entries = Object.entries(state);
  if (entries.length === 0) {
    return '';
  }

  // Map type codes to readable names
  const typeMap = {
    [FlowEditorConstants.StateVariableTypes.String]: 'str',
    [FlowEditorConstants.StateVariableTypes.Number]: 'number',
    [FlowEditorConstants.StateVariableTypes.List]: 'list',
    [FlowEditorConstants.StateVariableTypes.Json]: 'dict',
    [FlowEditorConstants.LegacyIntType]: 'int',
  };

  // Format each variable as: name (type)
  const formattedVars = entries
    .map(([name, config]) => {
      const type = config?.type || 'str';
      const readableType = typeMap[type] || type;
      return `\`${name}\` (${readableType})`;
    })
    .join(', ');

  return `Available pipeline state variables: ${formattedVars}`;
};

/**
 * Format available pipeline nodes for AI prompt context
 * Extracts node IDs from pipeline for routing decisions
 * @param {Array} nodes - The pipeline nodes array (yamlJsonObject.nodes)
 * @returns {string} - Formatted string of node IDs for prompt injection
 */
export const formatAvailableNodesForPrompt = nodes => {
  if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
    return '';
  }

  // Extract node IDs and filter out special nodes
  const nodeIds = nodes
    .map(node => node?.id)
    .filter(id => id && id !== 'state' && !id.includes('~~~')) // Filter out state node and condition nodes
    .map(id => `\`${id}\``);

  if (nodeIds.length === 0) {
    return '';
  }

  // Always include END as it's a valid routing target
  const allTargets = [...nodeIds, '`END`'].join(', ');

  return `Available routing targets (node IDs): ${allTargets}`;
};
