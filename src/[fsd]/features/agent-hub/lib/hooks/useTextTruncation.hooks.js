import { useCallback, useEffect, useRef, useState } from 'react';

export const useTextTruncation = ({ text, disabled = false }) => {
  const ref = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    setIsExpanded(false);
    setIsTruncated(false);
  }, [text]);

  useEffect(() => {
    if (disabled) {
      setIsTruncated(false);
      return;
    }
    if (isExpanded) return;
    const raf = requestAnimationFrame(() => {
      if (ref.current) {
        setIsTruncated(ref.current.scrollHeight > ref.current.clientHeight);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [disabled, isExpanded, text]);

  const toggle = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  return { ref, isExpanded, isTruncated, toggle };
};
