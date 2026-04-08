import { useCallback, useEffect, useMemo, useState } from 'react';

export const useSessionStorageDateFilter = (filterName, initialValue, filterGroup) => {
  const storedFilterName = useMemo(() => {
    return filterGroup ? `${filterName}:${filterGroup}` : filterName;
  }, [filterName, filterGroup]);

  const getInitialValue = useCallback(() => {
    return initialValue instanceof Function ? initialValue() : initialValue;
  }, [initialValue]);

  const [date, setDate] = useState(() => {
    const storedValue = sessionStorage.getItem(storedFilterName);
    return storedValue ? new Date(storedValue) : getInitialValue();
  });

  useEffect(() => {
    if (date) {
      sessionStorage.setItem(storedFilterName, date.toISOString());
    } else {
      sessionStorage.removeItem(storedFilterName);
    }
  }, [date, storedFilterName]);

  const reset = useCallback(() => {
    setDate(getInitialValue());
  }, [getInitialValue]);

  const isDefault = useMemo(() => date?.getTime() === getInitialValue()?.getTime(), [date, getInitialValue]);

  return [date, setDate, reset, isDefault];
};
