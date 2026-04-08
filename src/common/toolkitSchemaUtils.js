/**
 * Flattens json_schema_extra properties from Pydantic v2 into the property object.
 * Pydantic v2 puts extra fields like ui_component, configuration, secret etc
 * under a `json_schema_extra` key that needs to be flattened for frontend use.
 */
const flattenJsonSchemaExtra = properties => {
  if (!properties) return {};

  return Object.entries(properties).reduce((acc, [key, value]) => {
    if (value && typeof value === 'object') {
      // Extract json_schema_extra and flatten it into the property
      const { json_schema_extra, ...restValue } = value;
      acc[key] = {
        ...restValue,
        ...(json_schema_extra || {}),
      };
    } else {
      acc[key] = value;
    }
    return acc;
  }, {});
};

export const convertToolkitSchema = toolSchema => {
  if (!toolSchema || Object.keys(toolSchema).length === 0) {
    return {};
  }
  const { properties: rawProperties, required, $defs, ...rest } = toolSchema;

  // Flatten json_schema_extra from Pydantic v2 schemas
  const properties = flattenJsonSchemaExtra(rawProperties);

  const configKeys = Object.keys($defs || {});
  const llmModelProps = Object.keys(properties || {}).filter(
    key => properties[key].configuration_model === 'llm' || key === 'llm_model',
  );
  const embeddingModelProps = Object.keys(properties || {}).filter(
    key => properties[key].configuration_model === 'embedding' || key === 'embedding_model',
  );
  const imageGenerationModelProps = Object.keys(properties || {}).filter(
    key => properties[key].configuration_model === 'image_generation' || key === 'image_generation_model',
  );
  const toolkitProps = Object.keys(properties || {}).filter(key => properties[key].toolkit_types);
  const agentProps = Object.keys(properties || {}).filter(key => properties[key].agent_tags);
  const pipelineProps = Object.keys(properties || {}).filter(key => properties[key].pipeline_tags);
  const configProps = Object.keys(properties || {}).filter(key =>
    Array.isArray(properties[key].anyOf)
      ? properties[key].anyOf?.find(
          item => item.$ref && configKeys.includes(item.$ref.replace('#/$defs/', '')),
        )
      : configKeys.includes(properties[key].$ref?.replace('#/$defs/', '') || ''),
  );
  const nonConfigProps = Object.keys(properties || {}).filter(
    key =>
      !configProps.includes(key) &&
      !embeddingModelProps.includes(key) &&
      !imageGenerationModelProps.includes(key) &&
      !llmModelProps.includes(key) &&
      !toolkitProps.includes(key) &&
      !agentProps.includes(key) &&
      !pipelineProps.includes(key),
  );
  const normalProperties = nonConfigProps.reduce((acc, key) => {
    acc[key] = {
      ...properties[key],
    };
    return acc;
  }, {});
  const llmModelProperties = llmModelProps.reduce((acc, key) => {
    acc[key] = {
      ...properties[key],
      type: 'llm_model',
    };
    return acc;
  }, {});
  const embeddingModelProperties = embeddingModelProps.reduce((acc, key) => {
    acc[key] = {
      ...properties[key],
      type: 'embedding_model',
    };
    return acc;
  }, {});
  const imageGenerationModelProperties = imageGenerationModelProps.reduce((acc, key) => {
    acc[key] = {
      ...properties[key],
      type: 'image_generation_model',
    };
    return acc;
  }, {});
  const toolkitProperties = toolkitProps.reduce((acc, key) => {
    // Build toolkit_filter with toolkit_type and optionally application
    const toolkitFilter = {};
    if (properties[key].toolkit_types) {
      toolkitFilter.toolkit_type = properties[key].toolkit_types;
    }
    if (properties[key].application) {
      toolkitFilter.application = true;
    }

    acc[key] = {
      ...properties[key],
      originalType: properties[key].type,
      type: 'toolkit_reference',
      // Add toolkit_filter if there are any filters
      ...(Object.keys(toolkitFilter).length > 0 && { toolkit_filter: toolkitFilter }),
    };
    return acc;
  }, {});
  const agentProperties = agentProps.reduce((acc, key) => {
    acc[key] = {
      ...properties[key],
      originalType: properties[key].type,
      type: 'agent_reference',
      // Add agent_filter if agent_tags is specified, converting to API format
      ...(properties[key].agent_tags && {
        agent_filter: { agent_tags: properties[key].agent_tags },
      }),
    };
    return acc;
  }, {});
  const pipelineProperties = pipelineProps.reduce((acc, key) => {
    acc[key] = {
      ...properties[key],
      originalType: properties[key].type,
      type: 'pipeline_reference',
      // Add pipeline_filter if pipeline_tags is specified, converting to API format
      ...(properties[key].pipeline_tags && {
        pipeline_filter: { pipeline_tags: properties[key].pipeline_tags },
      }),
    };
    return acc;
  }, {});
  const configProperties = configProps.reduce((acc, key) => {
    const configDefKey = Array.isArray(properties[key].anyOf)
      ? properties[key].anyOf
          .find(item => item.$ref && configKeys.includes(item.$ref.replace('#/$defs/', '')))
          ?.$ref?.replace('#/$defs/', '') || ''
      : properties[key].$ref?.replace('#/$defs/', '') || '';
    acc[key] = {
      ...properties[key],
      type: 'configuration',
      section: $defs[configDefKey]?.metadata?.section || '',
    };
    return acc;
  }, {});

  // Convert the config_schema to a more usable format
  const convertedSchema = {
    ...rest,
    required,
    properties: {
      ...configProperties,
      ...llmModelProperties,
      ...embeddingModelProperties,
      ...imageGenerationModelProperties,
      ...toolkitProperties,
      ...agentProperties,
      ...pipelineProperties,
      ...normalProperties,
    },
  };
  // console.log('convertedSchema', convertedSchema)
  return convertedSchema;
};
