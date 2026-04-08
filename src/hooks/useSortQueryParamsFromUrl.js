import { useMemo } from 'react';

import { useSearchParams } from 'react-router-dom';

import { SearchParams } from '@/common/constants';

export default function useSortQueryParamsFromUrl({ defaultSortOrder, defaultSortBy }) {
  const [searchParams] = useSearchParams();
  const sort_order = useMemo(
    () => searchParams.get(SearchParams.SortOrder) || defaultSortOrder,
    [defaultSortOrder, searchParams],
  );
  const sort_by = useMemo(
    () => searchParams.get(SearchParams.SortBy) || defaultSortBy,
    [defaultSortBy, searchParams],
  );
  return {
    sort_order,
    sort_by,
  };
}
