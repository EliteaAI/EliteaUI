import { useCallback, useState } from 'react';

export const useTableSort = options => {
  const { defaultField = 'name', defaultDirection = 'asc', comparators = {} } = options || {};

  const [sortConfig, setSortConfig] = useState({
    field: defaultField,
    direction: defaultDirection,
  });

  const handleSort = useCallback(field => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const resetSort = useCallback(() => {
    setSortConfig({
      field: defaultField,
      direction: defaultDirection,
    });
  }, [defaultField, defaultDirection]);

  const sortData = useCallback(
    data => {
      if (!data || data.length === 0) {
        return data;
      }

      const sorted = [...data];
      const { field, direction } = sortConfig;

      sorted.sort((a, b) => {
        let aValue = a[field];
        let bValue = b[field];

        // Use custom comparator if provided
        if (comparators[field]) {
          const result = comparators[field](aValue, bValue, a, b);
          return direction === 'asc' ? result : -result;
        }

        // Handle null/undefined values
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return direction === 'asc' ? 1 : -1;
        if (bValue == null) return direction === 'asc' ? -1 : 1;

        // Default string comparison (case-insensitive)
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
      });

      return sorted;
    },
    [sortConfig, comparators],
  );

  return {
    sortConfig,
    handleSort,
    resetSort,
    sortData,
  };
};
