import { useEffect, useRef, useState } from 'react';

export default function useCheckViewScrollHorizontally() {
  const viewRef = useRef(null);
  const [isScrollable, setIsScrollable] = useState(false);

  useEffect(() => {
    const checkScrollable = () => {
      if (viewRef.current) {
        const { scrollWidth, clientWidth } = viewRef.current;
        setIsScrollable(scrollWidth > clientWidth); // Check if text is truncated
      }
    };

    checkScrollable();
    window.addEventListener('resize', checkScrollable); // Re-check on window resize
    return () => window.removeEventListener('resize', checkScrollable);
  }, []);

  return {
    viewRef,
    isScrollable,
  };
}
