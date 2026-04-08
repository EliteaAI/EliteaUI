import { useCallback, useEffect, useMemo, useState } from 'react';

export const useSessionStorageFilter = (filterName, initialValue, filterGroup = '') => {
  const storedFilterName = useMemo(() => {
    return filterGroup ? `${filterName}:${filterGroup}` : filterName;
  }, [filterName, filterGroup]);

  const getInitialValue = useCallback(() => {
    if (initialValue instanceof Function) return initialValue();
    return initialValue;
  }, [initialValue]);

  const [filter, setFilter] = useState(() => {
    const storedValue = sessionStorage.getItem(storedFilterName);
    return storedValue !== null ? JSON.parse(storedValue) : getInitialValue();
  });

  useEffect(() => {
    sessionStorage.setItem(storedFilterName, JSON.stringify(filter));
  }, [storedFilterName, filter]);

  const resetFilter = useCallback(() => {
    const initial = getInitialValue();
    setFilter(initial);
    sessionStorage.setItem(storedFilterName, JSON.stringify(initial));
  }, [getInitialValue, storedFilterName]);

  const isDefault = useCallback(() => {
    return JSON.stringify(filter) === JSON.stringify(getInitialValue());
  }, [filter, getInitialValue]);

  return [filter, setFilter, resetFilter, isDefault];
};
