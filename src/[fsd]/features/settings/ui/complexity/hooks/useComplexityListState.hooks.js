import { useCallback, useMemo } from 'react';

import { useSearchParams } from 'react-router-dom';

import { ComplexityConstants } from '@/[fsd]/features/settings/lib/constants';
import { ComplexityHelpers } from '@/[fsd]/features/settings/lib/helpers';

const { DEFAULT_PERIOD_DAYS, DEFAULT_SORT, LIST_SEARCH_PARAMS, PERIOD_OPTIONS, ROWS_PER_PAGE_OPTIONS } =
  ComplexityConstants;

const READ_OPTIONS = {
  keys: LIST_SEARCH_PARAMS,
  periods: PERIOD_OPTIONS,
  defaultPeriod: DEFAULT_PERIOD_DAYS,
  defaultSort: DEFAULT_SORT,
  rowsOptions: ROWS_PER_PAGE_OPTIONS,
};

// Defaults are left out of the URL so a plain link stays clean
const DEFAULTS = {
  [LIST_SEARCH_PARAMS.period]: DEFAULT_PERIOD_DAYS,
  [LIST_SEARCH_PARAMS.sortBy]: DEFAULT_SORT.sortBy,
  [LIST_SEARCH_PARAMS.sortOrder]: DEFAULT_SORT.sortOrder,
  [LIST_SEARCH_PARAMS.page]: '0',
  [LIST_SEARCH_PARAMS.rowsPerPage]: String(ROWS_PER_PAGE_OPTIONS[1]),
  [LIST_SEARCH_PARAMS.search]: '',
};

export const useComplexityListState = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const state = useMemo(() => ComplexityHelpers.readListState(searchParams, READ_OPTIONS), [searchParams]);

  const update = useCallback(
    (updates, { resetPage = true } = {}) =>
      setSearchParams(
        previous => {
          const next = new URLSearchParams(previous);
          const all = resetPage ? { [LIST_SEARCH_PARAMS.page]: 0, ...updates } : updates;
          Object.entries(all).forEach(([key, value]) => {
            const text = value == null ? '' : String(value);
            if (text === '' || DEFAULTS[key] === text) next.delete(key);
            else next.set(key, text);
          });
          return next;
        },
        { replace: true },
      ),
    [setSearchParams],
  );

  return { ...state, searchParams, update };
};
