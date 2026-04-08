import { isNullOrUndefined } from '@/common/utils';

const getSectionRequiredField = schema => {
  const { metadata: { sections } = {} } = schema || { metadata: {} };
  const requiredProps = [];

  if (sections) {
    const sectionArray = Object.entries(sections);
    for (const [, section] of sectionArray) {
      if (section.required) {
        const { subsections } = section;
        subsections.forEach(({ fields }) => {
          requiredProps.push(fields);
        });
      }
    }
  }

  return requiredProps;
};

const isFieldValid = (value, type) => {
  switch (type) {
    case 'string':
      return Boolean(value);

    case 'boolean':
      return value !== undefined;

    case 'integer':
      return !isNullOrUndefined(value) && !(typeof value === 'string' && !value);

    default:
      return Boolean(value);
  }
};

const validateSettingsBySchema = (settings, schema) => {
  if (!schema) {
    return false;
  }

  const { required, properties = {} } = schema;

  if (!required) {
    return true;
  }

  return required.every(fieldName => {
    const property = properties[fieldName] || {};

    // Skip if field has a default value
    if (property.default !== undefined) {
      return true;
    }

    const type = property.type || 'string';
    return isFieldValid(settings[fieldName], type);
  });
};

const validateSettingsBySchemaSections = (settings, schema) => {
  if (!schema) {
    return false;
  }

  const { metadata } = schema;
  const { sections } = metadata || {};

  if (sections) {
    const sectionArray = Object.entries(sections);

    for (const [, section] of sectionArray) {
      if (section.required) {
        const { subsections } = section;

        if (
          subsections.length &&
          !subsections.find(({ fields }) =>
            fields.reduce((acc, field) => acc && (settings[field] || settings[field] === 0), true),
          )
        ) {
          return false;
        }
      }
    }
  }

  return true;
};

const arrayToString = (arr, connector = 'and') => {
  if (!arr || !Array.isArray(arr) || !arr.length) {
    return '';
  }

  const newArray = [...arr];

  // If the array has only one item, return it as is
  if (newArray.length === 1) {
    return newArray[0];
  }

  // If the array has more than one item, format accordingly
  const lastItem = newArray.pop();
  return `${newArray.join(', ')} ${connector} ${lastItem}`;
};

export const validationSettings = (settings, schema, configurationSchema, needToCheckSection = true) => {
  const isValidForSchema = validateSettingsBySchema(settings, schema);
  const isValidForSchemaSections = !needToCheckSection || validateSettingsBySchemaSections(settings, schema);
  const isValidForConfigurationSchema =
    configurationSchema && validateSettingsBySchema(settings, configurationSchema);

  // Valid if either (schema AND sections) OR configuration schema is valid
  if ((isValidForSchema && isValidForSchemaSections) || isValidForConfigurationSchema) {
    return { isValid: true };
  }

  // Generate appropriate error message
  if (configurationSchema && settings.configuration_title) {
    return {
      isValid: false,
      errorMessage: `These settings are required: ${arrayToString(configurationSchema.required)}`,
    };
  }

  const requiredProps =
    !isValidForSchema && schema.required
      ? arrayToString(schema.required)
      : arrayToString(getSectionRequiredField(schema), 'or');

  return {
    isValid: false,
    errorMessage: `These settings are required: ${requiredProps}`,
  };
};
