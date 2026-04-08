import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook to detect text overflow
 * Returns true if the text is truncated (overflowing its container)
 */
export const useTextOverflow = text => {
  const textRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    let timeouts = [];
    const element = textRef.current;

    if (!element) return;
    const checkOverflow = () => {
      if (!textRef.current) return;

      const { scrollWidth, clientWidth } = textRef.current;
      const isTextOverflowing = scrollWidth > clientWidth;
      setIsOverflowing(isTextOverflowing);
    };

    // Check overflow with multiple delays to handle different rendering scenarios
    timeouts = [50, 200].map(delay => setTimeout(checkOverflow, delay));

    // Check overflow on resize
    const resizeObserver = new ResizeObserver(() => {
      setTimeout(checkOverflow, 10);
    });

    resizeObserver.observe(element);

    return () => {
      timeouts.forEach(timeoutId => clearTimeout(timeoutId));
      resizeObserver.disconnect();
    };
  }, [text]);

  return { textRef, isOverflowing };
};
