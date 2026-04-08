export const parseFieldValue = (value, type) => {
  if (type === 'integer') return parseInt(String(value), 10);
  if (type === 'number') return parseFloat(String(value));
  if (type === 'boolean') return value === true || value === 'true';
  return String(value || '').trim();
};

/**
 * Build a normalised field definition by merging the backend schema with
 * frontend fallback defaults from ENVIRONMENT_FIELD_DEFAULTS.
 */
export const buildFieldDefinition = (key, fieldSchema, defaults = {}) => ({
  key,
  label: fieldSchema?.title || key,
  tooltip: fieldSchema?.description || '',
  defaultValue: fieldSchema?.default,
  type: fieldSchema?.type || 'string',
  minLength: fieldSchema?.minLength ?? defaults.minLength,
  minimum: fieldSchema?.minimum ?? defaults.minimum,
  maximum: fieldSchema?.maximum ?? defaults.maximum,
});

export const validateFieldValue = (value, fieldSchema) => {
  const { type, minLength, minimum, maximum } = fieldSchema;

  if (type === 'string') {
    if (minLength && String(value).length < minLength) {
      return `Minimum length is ${minLength}`;
    }
  }

  if (type === 'integer' || type === 'number') {
    const num = parseFieldValue(value, type);
    if (Number.isNaN(num)) return 'Must be a valid number';
    if (minimum !== undefined && num < minimum) return `Minimum value is ${minimum}`;
    if (maximum !== undefined && num > maximum) return `Maximum value is ${maximum}`;
  }

  return null;
};

export const isNumericType = type => type === 'integer' || type === 'number';
