import { useCallback, useEffect, useState } from 'react';

export const useCheckViewScrollHorizontally = () => {
  const [element, setElement] = useState(null);
  const [isScrollable, setIsScrollable] = useState(false);

  const viewRef = useCallback(node => {
    if (node) setElement(node);
  }, []);

  useEffect(() => {
    if (!element) return;

    const checkScrollable = () => {
      const { scrollWidth, clientWidth } = element;
      setIsScrollable(scrollWidth > clientWidth);
    };

    checkScrollable();
    window.addEventListener('resize', checkScrollable);

    const resizeObserver = new ResizeObserver(() => setTimeout(checkScrollable, 10));
    resizeObserver.observe(element);

    return () => {
      window.removeEventListener('resize', checkScrollable);
      resizeObserver.disconnect();
    };
  }, [element]);

  return {
    viewRef,
    isScrollable,
  };
};
