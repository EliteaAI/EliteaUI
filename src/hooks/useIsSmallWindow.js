import { useCallback, useEffect, useState } from 'react';

import { MIN_LARGE_WINDOW_WIDTH } from '@/common/constants';

export default function useIsSmallWindow(onResizeCallback) {
  const [isSmallWindow, setIsSmallWindow] = useState(false);

  const onSize = useCallback(() => {
    const windowWidth = window.innerWidth;
    if (windowWidth < MIN_LARGE_WINDOW_WIDTH) {
      setIsSmallWindow(prev => {
        if (!prev) {
          onResizeCallback?.();
        }
        return true;
      });
    } else {
      setIsSmallWindow(prev => {
        if (prev) {
          onResizeCallback?.();
        }
        return false;
      });
    }
  }, [onResizeCallback]);

  useEffect(() => {
    onSize();
    window.addEventListener('resize', onSize);
    return () => {
      window.removeEventListener('resize', onSize);
    };
  }, [onSize]);

  return { isSmallWindow };
}
