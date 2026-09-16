const isPlainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * Deep-merges a (possibly partial) override palette on top of a base palette without mutating either.
 * Nested plain objects are merged; primitives and arrays from the override replace base values.
 */
export const mergePalette = (basePalette = {}, overridePalette = {}) => {
  if (!isPlainObject(overridePalette)) return basePalette;

  return Object.entries(overridePalette).reduce(
    (result, [key, overrideValue]) => {
      const baseValue = result[key];

      result[key] =
        isPlainObject(baseValue) && isPlainObject(overrideValue)
          ? mergePalette(baseValue, overrideValue)
          : overrideValue;

      return result;
    },
    { ...basePalette },
  );
};
