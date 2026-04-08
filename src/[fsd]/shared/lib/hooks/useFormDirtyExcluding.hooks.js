import { useMemo } from 'react';

import { useFormikContext } from 'formik';

/**
 * Custom hook that checks if form is dirty, excluding specified fields.
 * Useful for fields that are managed separately (e.g., is_pinned via pin/unpin API).
 */
export const useFormDirtyExcluding = (excludedFields = ['is_pinned']) => {
  const { dirty: isFormDirty, values, initialValues } = useFormikContext();

  const isDirty = useMemo(() => {
    if (!isFormDirty) return false;

    // Remove excluded fields from comparison
    const omitFields = (obj, fields) => {
      if (!obj || typeof obj !== 'object') return obj;

      const result = {};
      Object.keys(obj).forEach(key => {
        if (!fields.includes(key)) {
          result[key] = obj[key];
        }
      });
      return result;
    };

    const currentValuesFiltered = omitFields(values, excludedFields);
    const initialValuesFiltered = omitFields(initialValues, excludedFields);

    // Compare all fields except excluded ones
    return JSON.stringify(currentValuesFiltered) !== JSON.stringify(initialValuesFiltered);
  }, [isFormDirty, values, initialValues, excludedFields]);

  return isDirty;
};
