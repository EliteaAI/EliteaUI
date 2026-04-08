import { useMemo } from 'react';

import { useSearchParams } from 'react-router-dom';

import { SearchParams, ViewMode } from '@/common/constants';

export default function useSearchParamValue(searchParamKey) {
  const [searchParams] = useSearchParams();
  const searchParamValue = useMemo(
    () => searchParams.get(SearchParams[searchParamKey]) || undefined,
    [searchParamKey, searchParams],
  );
  return searchParamValue;
}

export const useAuthorNameFromUrl = () => {
  return useSearchParamValue('AuthorName');
};

export const useAuthorIdFromUrl = () => {
  return useSearchParamValue('AuthorId');
};

export const useViewModeFromUrl = (isCreating = false) => {
  const viewModeFromUrl = useSearchParamValue('ViewMode');
  return viewModeFromUrl || (isCreating ? ViewMode.Owner : ViewMode.Public);
};

export const useNameFromUrl = () => {
  return useSearchParamValue('Name');
};
