import { useCallback, useState } from 'react';

const useCtrlEnterKeyEventsHandler = ({
  onShiftEnterPressed,
  onCtrlEnterDown,
  onEnterDown,
  onNormalKeyDown,
}) => {
  const [isInComposition, setIsInComposition] = useState(false);
  const onKeyDown = useCallback(
    event => {
      if (isInComposition) {
        return;
      }
      // Check current event modifiers directly instead of relying on keysPressed tracking
      const hasModifier = event.ctrlKey || event.metaKey || event.altKey;
      // Handle specific key combinations
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && onCtrlEnterDown) {
        event.preventDefault();
        onCtrlEnterDown();
      } else if (event.shiftKey && event.key === 'Enter' && onShiftEnterPressed) {
        event.preventDefault();
        onShiftEnterPressed();
      } else if (!hasModifier && event.key === 'Enter' && onEnterDown) {
        event.preventDefault();
        onEnterDown(event);
      } else if (
        !hasModifier &&
        onNormalKeyDown &&
        // Also ignore standalone modifier keys
        !['Control', 'Meta', 'Alt', 'Shift'].includes(event.key)
      ) {
        // Call onNormalKeyDown only for normal keys without modifiers
        onNormalKeyDown(event);
      }
    },
    [isInComposition, onCtrlEnterDown, onShiftEnterPressed, onEnterDown, onNormalKeyDown],
  );

  const onKeyUp = useCallback(
    // eslint-disable-next-line no-unused-vars
    event => {},
    [],
  );

  const onCompositionStart = useCallback(() => {
    setIsInComposition(true);
  }, []);
  const onCompositionEnd = useCallback(() => {
    setIsInComposition(false);
  }, []);

  return { onKeyDown, onKeyUp, onCompositionStart, onCompositionEnd };
};

export default useCtrlEnterKeyEventsHandler;
