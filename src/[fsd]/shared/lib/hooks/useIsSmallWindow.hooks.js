import { useCallback, useEffect, useState } from 'react';

import { WindowConstants } from '@/[fsd]/shared/lib/constants';

const { MIN_LARGE_WINDOW_WIDTH } = WindowConstants;

export const useIsSmallWindow = onResizeCallback => {
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
};
