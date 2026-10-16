import { useCallback, useMemo, useState } from 'react';

export const useClientSort = (defaultSortBy, defaultSortOrder = 'desc') => {
  const [sort, setSort] = useState({ sortBy: defaultSortBy, sortOrder: defaultSortOrder });

  const handleSort = useCallback(key => {
    setSort(previous => ({
      sortBy: key,
      sortOrder: previous.sortBy === key && previous.sortOrder === 'desc' ? 'asc' : 'desc',
    }));
  }, []);

  return { sort, handleSort };
};

// Sorts rows with nulls/undefined last in either direction.
// `getValue(row, key)` extracts the raw comparable value; defaults to `row[key]`.
export const useSortedRows = (rows, sort, getValue) =>
  useMemo(() => {
    if (!rows || !rows.length) return rows ?? [];
    const { sortBy, sortOrder } = sort;
    const multiplier = sortOrder === 'asc' ? 1 : -1;

    return [...rows].sort((a, b) => {
      const av = getValue ? getValue(a, sortBy) : a[sortBy];
      const bv = getValue ? getValue(b, sortBy) : b[sortBy];

      const aNull = av == null;
      const bNull = bv == null;
      if (aNull && bNull) return 0;
      if (aNull) return 1;
      if (bNull) return -1;

      if (typeof av === 'string' && typeof bv === 'string') {
        return multiplier * av.localeCompare(bv, undefined, { sensitivity: 'base' });
      }
      return multiplier * (av - bv);
    });
  }, [rows, sort, getValue]);
