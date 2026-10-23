import { useMemo } from 'react';

import { useLocation } from 'react-router-dom';

export const useIsFrom = path => {
  const { pathname } = useLocation();
  const isFrom = useMemo(() => pathname.startsWith(path), [path, pathname]);
  return isFrom;
};
