import { useEffect, useMemo } from 'react';

import { useSearchParams } from 'react-router-dom';

import { SearchParams } from '@/common/constants';

export default function useCorrectUserNameInUrl(realName) {
  const [searchParams, setSearchParams] = useSearchParams();
  const nameFromUrl = useMemo(() => searchParams.get(SearchParams.Name) || '', [searchParams]);

  useEffect(() => {
    if (realName && nameFromUrl !== realName) {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set(SearchParams.Name, realName);
      setSearchParams(newSearchParams);
    }
  }, [nameFromUrl, realName, searchParams, setSearchParams]);
}
