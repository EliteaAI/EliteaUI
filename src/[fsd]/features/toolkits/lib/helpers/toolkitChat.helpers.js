import { matchesVisibleWhen } from './toolBase.helpers';

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

/**
 * Whether a filled-in number breaks its schema bounds. The number fields show the error inline but
 * still keep the value (e.g. `-5` against `minimum: 1`), so the run check has to reject it too.
 * @param {object} property - property schema, possibly an Optional `anyOf`
 * @param {*} value - current input value
 * @returns {boolean}
 */
export const isNumberOutOfRange = (property, value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return false;

  const numericType = property?.anyOf?.find(item => item.type === 'integer' || item.type === 'number');
  const pick = key => property?.[key] ?? numericType?.[key];
  const exclusiveMinimum = pick('exclusiveMinimum');
  const minimum = pick('minimum');
  const exclusiveMaximum = pick('exclusiveMaximum');
  const maximum = pick('maximum');

  return (
    (exclusiveMinimum !== undefined && value <= exclusiveMinimum) ||
    (minimum !== undefined && value < minimum) ||
    (exclusiveMaximum !== undefined && value >= exclusiveMaximum) ||
    (maximum !== undefined && value > maximum)
  );
};

export const validateToolkitForm = (schema, variables) => {
  const requiredFields = schema.required || [];
  const inputVariables = variables || {};
  const properties = schema.properties || {};

  // Fields hidden by `visible_when` show no error, so they must not block the run either
  const hasOutOfRangeNumber = Object.entries(inputVariables).some(([field, value]) => {
    const property = properties[field];
    if (property?.visible_when && !matchesVisibleWhen(property.visible_when, inputVariables)) return false;
    return isNumberOutOfRange(property, value);
  });
  if (hasOutOfRangeNumber) return false;

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

export const selectRunModel = (modelsData, { forIndexing }) => {
  const { items = [], low_tier_default_model_name, low_tier_default_model_project_id } = modelsData ?? {};
  const isProjectLowTier = model =>
    forIndexing &&
    model.name === low_tier_default_model_name &&
    String(model.project_id) === String(low_tier_default_model_project_id);
  const preferenceOrder = [isProjectLowTier, model => model.default, () => true];

  for (const preferred of preferenceOrder) {
    const selected = items.find(preferred);
    if (selected) return selected;
  }
  return null;
};
