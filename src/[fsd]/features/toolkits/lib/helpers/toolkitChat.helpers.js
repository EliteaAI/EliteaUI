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

/**
 * Drops optional parameters the user never filled in before a tool call is sent.
 *
 * Unfilled optional params get seeded with a schema-shaped placeholder (e.g. `null` for
 * number/integer, per `resolveSchemaDefault` in useToolkitTestRunner) so form fields render
 * as controlled inputs. Sending that placeholder to the underlying tool (e.g. a remote MCP
 * server's `per_page`/`page` args) makes the call fail type validation, even though the same
 * operation works fine from an agent context, where unset optional args are simply omitted
 * from the call. Stripping empty/null optional values here restores that same "omit if unset"
 * behavior for the Toolkits page test runner (issue #6263).
 * @param {object} schema - resolved tool schema
 * @param {object} variables - current tool input variables
 * @returns {object} a new object with empty optional params removed; required params are untouched
 */
export const sanitizeToolParams = (schema, variables) => {
  const requiredFields = schema?.required || [];
  const properties = schema?.properties || {};
  const inputVariables = variables || {};

  return Object.entries(inputVariables).reduce((acc, [key, value]) => {
    const isOptional = properties[key] !== undefined && !requiredFields.includes(key);
    const isEmpty = value === undefined || value === null || value === '';

    if (isOptional && isEmpty) return acc;

    acc[key] = value;
    return acc;
  }, {});
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
