import { useCallback, useEffect, useRef } from 'react';

export const useCatalogAutoRefresh = ({ refresh, lastRefreshedAt, isCacheValid, throttleMs }) => {
  const refreshRef = useRef(refresh);
  const lastRefreshedAtRef = useRef(lastRefreshedAt);
  const isCacheValidRef = useRef(isCacheValid);
  const throttleMsRef = useRef(throttleMs);

  refreshRef.current = refresh;
  lastRefreshedAtRef.current = lastRefreshedAt;
  isCacheValidRef.current = isCacheValid;
  throttleMsRef.current = throttleMs;

  const maybeRefresh = useCallback(() => {
    const lastRefreshed = lastRefreshedAtRef.current;
    if (!lastRefreshed) return;
    if (Date.now() - lastRefreshed < throttleMsRef.current) return;
    refreshRef.current?.();
  }, []);

  useEffect(() => {
    if (!isCacheValidRef.current) return;
    maybeRefresh();
  }, [maybeRefresh]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        maybeRefresh();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [maybeRefresh]);
};
