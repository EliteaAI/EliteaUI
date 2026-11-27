import { useEffect, useState } from 'react';

export const useDebounceValue = (value, delay, { isImmediate = false } = {}) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    if (isImmediate) {
      setDebouncedValue(value);
      return undefined;
    }
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay, isImmediate]);

  return isImmediate ? value : debouncedValue;
};
