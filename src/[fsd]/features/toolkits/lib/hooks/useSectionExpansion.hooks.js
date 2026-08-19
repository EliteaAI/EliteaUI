import { useCallback, useLayoutEffect, useRef, useState } from 'react';

export const useCollapsedSection = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const attentionAlreadyExpanded = useRef(false);

  const toggleExpanded = useCallback((_, nextExpanded) => setIsExpanded(nextExpanded), []);

  return { isExpanded, setIsExpanded, toggleExpanded, attentionAlreadyExpanded };
};

export const useExpandOnAttention = (needsAttention, section) => {
  const { setIsExpanded, attentionAlreadyExpanded } = section;

  useLayoutEffect(() => {
    const justStartedNeedingAttention = needsAttention && !attentionAlreadyExpanded.current;
    if (justStartedNeedingAttention) {
      setIsExpanded(true);
    }
    attentionAlreadyExpanded.current = needsAttention;
  }, [needsAttention, setIsExpanded, attentionAlreadyExpanded]);
};

export const useSectionExpansion = needsAttention => {
  const section = useCollapsedSection();

  useExpandOnAttention(needsAttention, section);

  return section;
};
