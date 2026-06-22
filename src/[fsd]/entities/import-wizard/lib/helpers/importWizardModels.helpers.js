const getDefaultModel = (model = {}, modelOptions, nameField = 'model_name') => {
  const modelsList = modelOptions.items;
  const model_name = model?.[nameField];
  const modelExists = modelsList.find(m => model_name && m.name === model_name);

  if (modelExists)
    return {
      [nameField]: model_name,
    };
  else
    return {
      [nameField]: modelsList[0]?.name || '',
    };
};

export const setDefaultModelsForImportedAgents = (importedAgents, modelOptions) => {
  const agents = [];

  importedAgents?.forEach(agent => {
    const newAgent = {
      ...agent,
    };
    if (agent.versions) {
      const newVersions = [];
      const seenNames = new Set();
      agent.versions.forEach(version => {
        const newVersion = {
          ...version,
        };

        // Rename agent_type "agent" to "openai" for backward compatibility
        if (newVersion.agent_type === 'agent') newVersion.agent_type = 'openai';

        // Rename "latest" or empty names to "base"
        if (!newVersion.name || newVersion.name === 'latest') {
          newVersion.name = 'base';
        }
        // Deduplicate versions by name (keep first occurrence)
        if (seenNames.has(newVersion.name)) {
          return; // Skip duplicate
        }
        seenNames.add(newVersion.name);
        const { llm_settings = {} } = version;
        const model = getDefaultModel(llm_settings, modelOptions);
        newVersion['llm_settings'] = {
          ...llm_settings,
          ...model,
        };
        newVersions.push(newVersion);
      });
      newAgent.versions = [...newVersions];
    }
    agents.push(newAgent);
  });
  return agents;
};

export const rematchModels = ({ importItems, modelOptions }) => {
  const rematchedImportItems = importItems?.map(item => {
    if (item.entity === 'agents') return setDefaultModelsForImportedAgents([item], modelOptions)[0];
    else return item;
  });
  return rematchedImportItems;
};
