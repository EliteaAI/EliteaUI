import { useCallback, useState } from 'react';

export const useFieldFocus = (initialState = null) => {
  const [focusedField, setFocusedField] = useState(initialState);

  const toggleFieldFocus = useCallback((field = null) => {
    setFocusedField(field);
  }, []);

  const isFocused = useCallback(field => field === focusedField, [focusedField]);

  return { focusedField, toggleFieldFocus, isFocused };
};
