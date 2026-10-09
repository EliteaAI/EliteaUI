import { useEffect } from 'react';

const MESSAGE_INPUT_SELECTOR = '[contenteditable="true"], textarea';

export const useFocusRunInput = ({ containerRef, focusRequest, isReady, onFocusHandled }) => {
  useEffect(() => {
    if (!focusRequest || !isReady || !containerRef.current) return;
    containerRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    containerRef.current.querySelector(MESSAGE_INPUT_SELECTOR)?.focus();
    onFocusHandled();
  }, [containerRef, focusRequest, isReady, onFocusHandled]);
};
