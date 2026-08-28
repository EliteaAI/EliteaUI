// Imported from the module rather than the helpers barrel: the barrel re-exports siblings that
// reach the settings slice, whose module-scope localStorage read breaks any test importing this.
import { validateToolkitForm } from '@/[fsd]/features/toolkits/lib/helpers/toolkitChat.helpers';

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

/**
 * A null baseline means the server's configuration has not reached the form yet — the schema is
 * still loading, or the index metadata has not arrived. Comparing against an empty form in that
 * window would report every untouched index as edited, arm the navigation warning, and let Save
 * persist a blank configuration over the stored one.
 */
export const isIndexConfigDirty = (schema, values, baseline) =>
  baseline !== null &&
  baseline !== undefined &&
  !deepEqual(normalizeIndexConfig(schema, values), normalizeIndexConfig(schema, baseline));

/**
 * index_name is immutable, hidden from the form, and stamped from the route when the server saves,
 * so requiring it here would disable both actions with no field to fill in.
 */
export const IMMUTABLE_INDEX_CONFIG_FIELDS = ['index_name'];

export const isIndexConfigValid = (schema, values) => {
  if (!schema) return true;

  const required = (schema.required || []).filter(key => !IMMUTABLE_INDEX_CONFIG_FIELDS.includes(key));

  return validateToolkitForm({ ...schema, required }, values);
};

export const saveConfigurationError = error =>
  error?.data?.error || 'Failed to save the index configuration.';
