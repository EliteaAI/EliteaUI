import { useCallback, useLayoutEffect, useRef, useState } from 'react';

export const CONFIGURATION_SECTION_KEY = 'toolkit_configuration_expanded';
export const TOOLS_SECTION_KEY = 'toolkit_tools_expanded';

const readStorage = (key, defaultValue) => {
  try {
    const stored = localStorage.getItem(key);
    return stored !== null ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const writeStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore write errors (private browsing, quota exceeded)
  }
};

export const useCollapsedSection = (storageKey = null, defaultExpanded = true) => {
  const [isExpanded, setIsExpandedState] = useState(() =>
    storageKey ? readStorage(storageKey, defaultExpanded) : defaultExpanded,
  );
  const attentionAlreadyExpanded = useRef(false);

  const setIsExpanded = useCallback(
    value => {
      setIsExpandedState(value);
      if (storageKey) writeStorage(storageKey, value);
    },
    [storageKey],
  );

  const toggleExpanded = useCallback((_, nextExpanded) => setIsExpanded(nextExpanded), [setIsExpanded]);

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
