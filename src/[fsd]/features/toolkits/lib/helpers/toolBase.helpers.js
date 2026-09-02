export const isSecretField = (key, format, secret, fullSchema = null) => {
  // Check top-level format and secret properties first
  if (format === 'password' || !!secret) {
    return true;
  }

  // Check for anyOf/oneOf patterns that contain password format
  if (fullSchema && (fullSchema.anyOf || fullSchema.oneOf)) {
    const schemas = fullSchema.anyOf || fullSchema.oneOf;
    const hasPasswordFormat = schemas.some(schema => schema.format === 'password' || !!schema.secret);
    if (hasPasswordFormat) {
      return true;
    }
  }

  return false;
};

const specialLabelMap = {
  'cache ttl': 'Cache TTL',
};

export const adjustLabel = label => {
  return (
    specialLabelMap[label.toLowerCase()] ||
    label
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  );
};

/**
 * Extract integer constraints from a property schema
 * Handles both direct properties and anyOf patterns
 */
export const getIntegerConstraints = propertySchema => {
  if (!propertySchema) return null;

  let { exclusiveMinimum, minimum, exclusiveMaximum, maximum } = propertySchema;

  // Check inside anyOf for Optional types
  if (propertySchema.anyOf) {
    const integerType = propertySchema.anyOf.find(item => item.type === 'integer');
    if (integerType) {
      exclusiveMinimum = exclusiveMinimum ?? integerType.exclusiveMinimum;
      minimum = minimum ?? integerType.minimum;
      exclusiveMaximum = exclusiveMaximum ?? integerType.exclusiveMaximum;
      maximum = maximum ?? integerType.maximum;
    }
  }

  const hasConstraints =
    exclusiveMinimum !== undefined ||
    minimum !== undefined ||
    exclusiveMaximum !== undefined ||
    maximum !== undefined;

  return hasConstraints ? { exclusiveMinimum, minimum, exclusiveMaximum, maximum } : null;
};

/**
 * Validate an integer value against constraints
 * Returns error message string or false if valid
 */
export const validateIntegerConstraints = (value, constraints) => {
  if (!constraints) return false;

  const { exclusiveMinimum, minimum, exclusiveMaximum, maximum } = constraints;

  // Check for empty/undefined/null values
  if (value === undefined || value === null || value === '') {
    if (exclusiveMinimum !== undefined || minimum !== undefined) {
      return 'Field is required';
    }
    return false;
  }

  const numValue = typeof value === 'number' ? value : parseInt(String(value), 10);
  if (isNaN(numValue)) {
    return 'Field is required';
  }

  if (exclusiveMinimum !== undefined && numValue <= exclusiveMinimum) {
    return `Value must be greater than ${exclusiveMinimum}`;
  }
  if (minimum !== undefined && numValue < minimum) {
    return `Value must be at least ${minimum}`;
  }
  if (exclusiveMaximum !== undefined && numValue >= exclusiveMaximum) {
    return `Value must be less than ${exclusiveMaximum}`;
  }
  if (maximum !== undefined && numValue > maximum) {
    return `Value must be at most ${maximum}`;
  }

  return false;
};

/**
 * Check if a property is an integer type
 */
export const isIntegerType = propertySchema => {
  if (!propertySchema) return false;
  return (
    propertySchema.type === 'integer' ||
    (propertySchema.anyOf && propertySchema.anyOf.some(item => item.type === 'integer'))
  );
};

const matchesVisibleWhen = (visibleWhen, settings) => {
  const currentValue = settings?.[visibleWhen.field];
  const expectedValue = visibleWhen.value;
  return typeof currentValue === 'string' && typeof expectedValue === 'string'
    ? currentValue.toLowerCase() === expectedValue.toLowerCase()
    : currentValue === expectedValue;
};

const hasValue = value => value !== null && value !== undefined && value !== '';

export const HEADER_NAME_PATTERN = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;

export const isHeaderNameInvalid = name => {
  if (!name) return true;
  return !HEADER_NAME_PATTERN.test(name);
};

export const isHeaderValueInvalid = value =>
  !hasValue(value) || (typeof value === 'string' && /\r|\n/.test(value));

export const validateSecretHeaders = headers => {
  if (!headers || typeof headers !== 'object' || Array.isArray(headers)) return false;
  return Object.entries(headers).some(
    ([name, value]) => isHeaderNameInvalid(name) || isHeaderValueInvalid(value),
  );
};

export const isPropertyVisible = ({
  propertyKey,
  property,
  settings,
  required = false,
  disableConfigFields = false,
  showOnlyConfigurationFields = false,
  showOnlyRequiredFields = false,
}) => {
  if (!property || property.hidden) return false;

  if (property.visible_when && !matchesVisibleWhen(property.visible_when, settings)) return false;

  if (disableConfigFields) {
    return propertyKey === 'elitea_title' || hasValue(settings?.[propertyKey]);
  }

  if (showOnlyConfigurationFields && !property.configuration) return false;

  return !(showOnlyRequiredFields && !required);
};

/**
 * Validate required fields and return errors object
 */
export const validateRequiredFields = (
  schema,
  settings,
  sectionProps = [],
  enableEditEliteaTitle = false,
) => {
  const errors = {};

  schema?.required
    ?.filter(prop => (enableEditEliteaTitle || prop !== 'elitea_title') && !sectionProps.includes(prop))
    .forEach(prop => {
      const propSchema = schema?.properties[prop];
      if (propSchema?.type === 'boolean' || !propSchema) {
        errors[prop] = false;
      } else if (propSchema?.ui_component === 'secret_headers') {
        const hasHeaders = Object.keys(settings[prop] || {}).length > 0;
        errors[prop] = !hasHeaders || validateSecretHeaders(settings[prop]);
      } else {
        errors[prop] = !settings[prop];
      }
    });

  return errors;
};
