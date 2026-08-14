import { useCallback, useEffect, useState } from 'react';

import { usePinApi } from './usePinApi.hooks';

export const usePin = props => {
  const { entityId, entityType, initialPinned = false, formikContext = null, onPinChange } = props;

  const formikFieldName = 'is_pinned';

  const [localIsPinned, setLocalIsPinned] = useState(initialPinned);

  useEffect(() => {
    if (!formikContext) {
      setLocalIsPinned(initialPinned);
    }
  }, [initialPinned, formikContext, entityId]);

  const isPinned = formikContext ? (formikContext?.values?.[formikFieldName] ?? false) : localIsPinned;

  const handlePinSuccess = useCallback(
    (_id, newState) => {
      if (formikContext) {
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
