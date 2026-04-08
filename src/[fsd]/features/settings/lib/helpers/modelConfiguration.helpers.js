export const getConfigurationOptions = configurations => {
  return (configurations || []).reduce((accumulator, model) => {
    const modelName = model?.name || `Model ${model?.id || 'Unknown'}`;
    const modelId = model?.id || model?.name || 'unknown';

    const groupName = `Project ${model?.project_id || 'Default'}`;
    const groupId = model?.project_id || 'default';

    if (!accumulator[groupName]) {
      accumulator[groupName] = [];
    }

    const existingModel = accumulator[groupName].find(
      existingItem =>
        existingItem.value === modelId ||
        existingItem.label === modelName ||
        (existingItem.originalModel?.id === model?.id && existingItem.originalModel?.name === model?.name),
    );

    if (!existingModel) {
      accumulator[groupName].push({
        label: modelName,
        value: modelId,
        group: groupId,
        group_name: groupName,
        config_name: groupName,
        capabilities: model?.capabilities || {},
        originalModel: model,
      });
    }

    return accumulator;
  }, {});
};

/**
 * Remove duplicate models from configurations array
 * @param {Array} models - Array of models
 * @returns {Array} - Deduplicated models
 */
export const removeDuplicateModels = models => {
  const seen = new Set();
  return models.filter(model => {
    const key = `${model?.id || 'unknown'}-${model?.name || 'unknown'}-${model?.project_id || 'default'}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

export const getModelCapabilities = (options, configurationUid, modelName) => {
  if (!modelName) return [];

  const groupedOptions = Object.values(options).filter(item => item.length);
  const foundGroup = groupedOptions.find(groupedOption => groupedOption[0]?.group === configurationUid);
  const foundOption = foundGroup?.find(({ value: itemValue }) => itemValue === modelName) || {};

  const capabilityMap = {
    chat_completion: 'Chat',
    completion: 'Completion',
    embedding: 'Embeddings',
    embeddings: 'Embeddings',
    reasoning: 'Reasoning',
    code_generation: 'Code Generation',
    function_calling: 'Function Calling',
  };

  return Object.entries(foundOption?.capabilities || {})
    .filter(([, value]) => value === true)
    .map(([key]) => capabilityMap[key] || key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()));
};

export const buildConfigurationData = ({
  userApiUrl,
  projectId,
  model,
  configurationsBySections,
  uniqueConfigurations,
}) => {
  let capabilitiesList = [];
  if (uniqueConfigurations && model.model_name && model.configuration_uid) {
    const configurationOptions = getConfigurationOptions(uniqueConfigurations);
    const groupedOptions = Object.values(configurationOptions).filter(item => item.length);
    const foundGroup = groupedOptions.find(
      groupedOption => groupedOption[0]?.group === model.configuration_uid,
    );
    const foundOption = foundGroup?.find(({ value: itemValue }) => itemValue === model.model_name) || {};

    capabilitiesList = Object.entries(foundOption?.capabilities || {})
      .filter(([, value]) => value === true)
      .map(([key]) => key);
  }

  const extractConfigName = config =>
    config?.data?.name ||
    config?.data?.model ||
    config?.data?.model_name ||
    config.title ||
    config.settings?.title ||
    config.config?.name ||
    config.label ||
    config.elitea_title ||
    config.name ||
    config.type;

  return {
    project_configuration: {
      server_url: userApiUrl || 'Not configured',
      base_url: userApiUrl ? `${userApiUrl.replace('/api/v2', '')}/llm/v1` : 'Not configured',
      project_id: projectId || 'Not configured',
    },
    configuration_options: {
      model_name: model.model_name || '',
      configuration_type: model.configuration_name || '',
      configuration_uid: model.configuration_uid || '',
    },
    model_capabilities: capabilitiesList,
    available_configurations: {
      llm_models:
        configurationsBySections.llm?.map(config => ({
          id: config.id,
          name: extractConfigName(config),
          type: config.type,
          shared: config.shared === true,
          project_id: config.project_id,
        })) || [],
      embedding_models:
        configurationsBySections.embedding?.map(config => ({
          id: config.id,
          name: extractConfigName(config),
          type: config.type,
          shared: config.shared === true,
          project_id: config.project_id,
        })) || [],
      vector_storages:
        configurationsBySections.vectorstorage?.map(config => ({
          id: config.id,
          name: extractConfigName(config),
          type: config.type,
          shared: config.shared === true,
          project_id: config.project_id,
        })) || [],
      ai_credentials:
        configurationsBySections.ai_credentials?.map(config => ({
          id: config.id,
          name: extractConfigName(config),
          type: config.type,
          shared: config.shared === true,
          project_id: config.project_id,
        })) || [],
      image_generation_models:
        configurationsBySections.image_generation?.map(config => ({
          id: config.id,
          name: extractConfigName(config),
          type: config.type,
          shared: config.shared === true,
          project_id: config.project_id,
        })) || [],
    },
  };
};
