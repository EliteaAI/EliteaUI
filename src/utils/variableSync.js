/**
 * Utility for synchronizing agent variables with participant variables
 * Agent variables serve as the source of truth for structure/schema
 * Participant variables preserve custom values
 */

/**
 * Synchronize agent variables with participant variables, syncing keys and preserving participant custom values
 * @param {Array} agentVariables - Variables from agent's version_details (source of truth for structure)
 * @param {Array} participantVariables - Current participant's entity_settings variables (custom values)
 * @returns {Array} Synced variables with synchronized keys (name) and preserved participant values
 */
export const syncVariableKeys = (agentVariables = [], participantVariables = []) => {
  // If agent has no variables, return empty array (participant should be cleaned)
  if (!agentVariables.length) {
    return [];
  }

  // If participant has no custom variables, use agent variables with their default values
  if (!participantVariables.length) {
    return agentVariables.map(agentVar => ({ ...agentVar }));
  }

  // Create a map of participant variables by name for quick lookup
  const participantVarMap = new Map();
  participantVariables.forEach(variable => {
    if (variable.name) {
      participantVarMap.set(variable.name, variable);
    }
  });

  // Synchronize keys: only keep variables that exist in agent schema
  // Use agent variables as the source of truth for keys/structure
  const syncedVariables = agentVariables.map(agentVar => {
    const participantVar = participantVarMap.get(agentVar.name);

    if (participantVar) {
      // Variable exists in participant settings - preserve the participant's custom value
      return {
        ...agentVar, // Use agent's structure/metadata (includes key sync)
        value: participantVar.value, // But keep participant's custom value
      };
    } else {
      // New variable from agent - use agent's default value
      return { ...agentVar };
    }
  });

  // Note: Variables in participant that don't exist in agent are automatically removed
  // since we only iterate over agent variables

  return syncedVariables;
};
