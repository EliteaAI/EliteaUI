import { useMemo } from 'react';

export const useIsVersionNotFound = ({ version, isFetching, isError, versions, skip }) => {
  return useMemo(() => {
    if (skip) return false;
    if (!version || isFetching || isError) return false;
    if (!versions || versions.length === 0) return false;

    return !versions.some(v => String(v.id) === String(version));
  }, [skip, version, isFetching, isError, versions]);
};
