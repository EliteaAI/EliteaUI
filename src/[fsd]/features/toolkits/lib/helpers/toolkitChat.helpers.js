/**
 * For properties the caller supplies itself: removing them, rather than hiding them, is what stops a
 * rendered field or a seeded default putting a competing value back into the tool params.
 * @param {object} schema - resolved tool schema
 * @param {string[]} propNames - property names to remove
 * @returns {object} a new schema; the original is untouched
 */
export const omitSchemaProperties = (schema, propNames) => {
  if (!schema?.properties) return schema;

  const properties = { ...schema.properties };
  propNames.forEach(name => delete properties[name]);

  return {
    ...schema,
    properties,
    required: (schema.required || []).filter(name => !propNames.includes(name)),
  };
};

export const validateToolkitForm = (schema, variables) => {
  const requiredFields = schema.required || [];
  const inputVariables = variables || {};

  return requiredFields.every(field => {
    const value = inputVariables[field];
    const property = schema.properties[field];

    // Check if the value exists and is not empty
    if (value === undefined || value === null || value === '' || value === 0) {
      return false;
    }
    // For arrays, check if they have at least one item
    return !(Array.isArray(value) && value.length === 0) && !property.error;
  });
};
