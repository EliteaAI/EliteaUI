const isPlainObject = value => typeof value === 'object' && value !== null && !Array.isArray(value);

const deepEqual = (left, right) => {
  if (left === right) return true;

  if (Array.isArray(left) && Array.isArray(right))
    return left.length === right.length && left.every((item, i) => deepEqual(item, right[i]));

  if (isPlainObject(left) && isPlainObject(right)) {
    const keys = Object.keys(left);
    return (
      keys.length === Object.keys(right).length &&
      keys.every(key => key in right && deepEqual(left[key], right[key]))
    );
  }

  return false;
};

/**
 * ToolFormContainer displays `property.default` for keys absent from the config without writing
 * them into state, so a field edited and then reverted to its default adds a key the saved config
 * never had. Comparing raw objects would report dirty forever with the form visually identical to
 * what is stored, so both sides are filled in with the same defaults before comparing.
 */
export const normalizeIndexConfig = (schema, values) => {
  const properties = schema?.properties || {};
  const config = { ...(values || {}) };

  Object.entries(properties).forEach(([key, property]) => {
    if (!(key in config) && property?.default !== undefined) config[key] = property.default;
  });

  return config;
};

export const isIndexConfigDirty = (schema, values, baseline) =>
  !deepEqual(normalizeIndexConfig(schema, values), normalizeIndexConfig(schema, baseline));

export const saveConfigurationError = error =>
  error?.data?.error || 'Failed to save the index configuration.';
