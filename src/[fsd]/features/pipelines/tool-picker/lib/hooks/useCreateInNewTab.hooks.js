import { useCallback, useEffect, useRef } from 'react';

import { getBasename } from '@/routes';

/**
 * Opens a create page in a new browser tab and calls `onReturn` when the user comes back to this tab,
 * so the picker can show what was created there.
 */
export const useCreateInNewTab = onReturn => {
  const isCreatingRef = useRef(false);
  const onReturnRef = useRef(onReturn);
  onReturnRef.current = onReturn;

  useEffect(() => {
    const onFocus = () => {
      if (!isCreatingRef.current) return;
      isCreatingRef.current = false;
      onReturnRef.current?.();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  return useCallback(route => {
    isCreatingRef.current = true;
    window.open(`${window.location.origin}${getBasename()}${route}`, '_blank', 'noopener');
  }, []);
};
