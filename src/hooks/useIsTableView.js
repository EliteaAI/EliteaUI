import { useMemo } from 'react';

import { useSearchParams } from 'react-router-dom';

import { SearchParams, ViewOptions } from '@/common/constants';

const useIsTableView = () => {
  const [searchParams] = useSearchParams();
  return useMemo(() => searchParams.get(SearchParams.View) === ViewOptions.Table, [searchParams]);
};

export default useIsTableView;
