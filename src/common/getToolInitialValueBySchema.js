const getToolProperties = schema =>
  Object.keys(schema.properties).map(property => ({
    name: property,
    ...schema.properties[property],
  }));

export const getArrayOptions = (schema, itemRef) => {
  let prop = schema;
  const paths = itemRef.replace('#/', '').split('/');
  paths.forEach(path => (prop = prop ? prop[path] : undefined));
  return prop?.enum || [];
};

export const getPropValue = ({
  schema,
  name,
  type,
  format,
  defaultValue,
  items,
  configuration_types,
  defaultVectorStorage,
  defaultEmbeddingModel,
  defaultImageGenerationModel,
}) => {
  switch (type) {
    case 'string':
      if (format === 'password') {
        return null;
      } else {
        return defaultValue || '';
      }
    case 'integer':
      return defaultValue !== undefined ? defaultValue : undefined;
    case 'array': {
      if (name !== 'selected_tools') {
        return defaultValue || [];
      } else {
        if (items) {
          return (
            items.enum ||
            (items.const ? [items.const] : items.itemRef ? getArrayOptions(schema, items.itemRef) : [])
          );
        } else {
          return defaultValue || [];
        }
      }
    }
    case 'boolean':
      return defaultValue || false;
    case 'object':
      return defaultValue || {};
    case 'embedding_model':
      return defaultValue || defaultEmbeddingModel || '';
    case 'image_generation_model':
      return defaultValue || defaultImageGenerationModel || '';
    default:
      if (configuration_types) {
        if (name === 'pgvector_configuration' && defaultVectorStorage?.elitea_title) {
          return defaultVectorStorage;
        }
        return defaultValue || defaultVectorStorage?.[name]?.[0] || null;
      } else if (defaultValue === null) {
        return null;
      }
      return defaultValue || '';
  }
};

export const genInitialToolSettings = (
  schema,
  defaultVectorStorage = {},
  defaultEmbeddingModel = '',
  defaultImageGenerationModel = '',
) => {
  const settings = {};
  const properties = getToolProperties(schema);
  properties.forEach(({ name, type, format, default: defaultValue, items, configuration_types }) => {
    settings[name] = getPropValue({
      schema,
      name,
      type,
      format,
      defaultValue,
      items,
      configuration_types,
      defaultVectorStorage,
      defaultEmbeddingModel,
      defaultImageGenerationModel,
    });
  });
  return settings;
};

export default function getToolInitialValueBySchema(
  schema,
  defaultVectorStorage = {},
  defaultEmbeddingModel = '',
  defaultImageGenerationModel = '',
) {
  return schema
    ? {
        name: '',
        description: '',
        settings: genInitialToolSettings(
          schema,
          defaultVectorStorage,
          defaultEmbeddingModel,
          defaultImageGenerationModel,
        ),
      }
    : {
        name: '',
        description: '',
        settings: {},
      };
}
