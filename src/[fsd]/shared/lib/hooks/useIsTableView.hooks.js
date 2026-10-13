import { useMemo } from 'react';

import { useSearchParams } from 'react-router-dom';

import { SearchParams, ViewOptions } from '@/common/constants';

export const useIsTableView = () => {
  const [searchParams] = useSearchParams();
  return useMemo(() => searchParams.get(SearchParams.View) === ViewOptions.Table, [searchParams]);
};
