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

/**
 * Get the initial value for a property based on its schema.
 *
 * @param {object} params
 * @param {*} params.defaultValue - Standard JSON Schema 'default' attribute
 * @param {*} params.prefillValue - Custom 'prefill_value' attribute for pre-filling required fields.
 *   Unlike 'default', prefill_value is a UI hint that doesn't affect Pydantic validation.
 *   This allows fields to be truly required (in 'required' array) while still showing
 *   a sensible initial value in the form. Used when a field must not be empty but has
 *   a common/recommended value (e.g., GitHub API URL: https://api.github.com).
 */
export const getPropValue = ({
  schema,
  name,
  type,
  format,
  defaultValue,
  prefillValue,
  items,
  configuration_types,
  defaultVectorStorage,
  defaultEmbeddingModel,
  defaultImageGenerationModel,
}) => {
  // prefill_value takes precedence as it's explicitly set for UI pre-filling
  const effectiveDefault = prefillValue ?? defaultValue;

  switch (type) {
    case 'string':
      if (format === 'password') {
        return null;
      } else {
        return effectiveDefault || '';
      }
    case 'integer':
      return effectiveDefault !== undefined ? effectiveDefault : undefined;
    case 'array': {
      if (name !== 'selected_tools') {
        return effectiveDefault || [];
      } else {
        if (items) {
          return (
            items.enum ||
            (items.const ? [items.const] : items.itemRef ? getArrayOptions(schema, items.itemRef) : [])
          );
        } else {
          return effectiveDefault || [];
        }
      }
    }
    case 'boolean':
      return effectiveDefault || false;
    case 'object':
      return effectiveDefault || {};
    case 'embedding_model':
      return effectiveDefault || defaultEmbeddingModel || '';
    case 'image_generation_model':
      return effectiveDefault || defaultImageGenerationModel || '';
    default:
      if (configuration_types) {
        if (name === 'pgvector_configuration' && defaultVectorStorage?.elitea_title) {
          return defaultVectorStorage;
        }
        return effectiveDefault || defaultVectorStorage?.[name]?.[0] || null;
      } else if (effectiveDefault === null) {
        return null;
      }
      return effectiveDefault || '';
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
  properties.forEach(
    ({
      name,
      type,
      format,
      default: defaultValue,
      prefill_value: prefillValue,
      items,
      configuration_types,
    }) => {
      settings[name] = getPropValue({
        schema,
        name,
        type,
        format,
        defaultValue,
        prefillValue,
        items,
        configuration_types,
        defaultVectorStorage,
        defaultEmbeddingModel,
        defaultImageGenerationModel,
      });
    },
  );
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
