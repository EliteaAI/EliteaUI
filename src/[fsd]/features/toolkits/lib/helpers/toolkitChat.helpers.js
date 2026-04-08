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
