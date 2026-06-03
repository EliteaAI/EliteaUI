import { useCallback, useEffect, useState } from 'react';

import { usePinApi } from './usePinApi.hooks';

/**
 * Hook with built-in state management for pin/unpin functionality
 * Supports both Formik integration and local state management
 */
export const usePin = props => {
  const { entityId, entityType, initialPinned = false, formikContext = null, onPinChange } = props;

  const formikFieldName = 'is_pinned';

  // Local state for non-Formik usage
  const [localIsPinned, setLocalIsPinned] = useState(initialPinned);

  // Sync initial state when entity changes (only for local state)
  useEffect(() => {
    if (!formikContext) {
      setLocalIsPinned(initialPinned);
    }
  }, [initialPinned, formikContext, entityId]);

  // Determine current pin state
  const isPinned = formikContext ? (formikContext?.values?.[formikFieldName] ?? false) : localIsPinned;

  const handlePinSuccess = useCallback(
    (_id, newState) => {
      if (formikContext) {
        // Note: This will make the form dirty, but SaveApplicationButton excludes is_pinned from dirty check
        formikContext.setFieldValue(formikFieldName, newState, false);
      } else {
        setLocalIsPinned(newState);
      }

      onPinChange?.(newState);
    },
    [formikContext, formikFieldName, onPinChange],
  );

  const { togglePin, isLoading } = usePinApi({
    id: entityId,
    isPinned,
    type: entityType,
    onSuccess: handlePinSuccess,
  });

  return {
    isPinned,
    togglePin,
    isLoading,
  };
};
