import { useCallback, useLayoutEffect, useRef, useState } from 'react';

// The element's bottom edge in the viewport, kept up to date on resize
export const useElementBottom = () => {
  const ref = useRef(null);
  const [bottom, setBottom] = useState(0);

  const measure = useCallback(() => {
    if (ref.current) setBottom(Math.round(ref.current.getBoundingClientRect().bottom));
  }, []);

  useLayoutEffect(() => {
    measure();
    const element = ref.current;
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (element) observer?.observe(element);
    window.addEventListener('resize', measure);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [measure]);

  return { ref, bottom };
};
