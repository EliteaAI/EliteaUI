import { useCallback, useMemo } from 'react';

import { mapContentTypeToEntityType } from '@/[fsd]/widgets/PinToggler/lib/helpers';
import { useTogglePinItemMutation } from '@/api/social';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

export const usePinApi = props => {
  const { id, isPinned, type, onSuccess } = props;
  const [togglePinItem, { isLoading }] = useTogglePinItemMutation();
  const projectId = useSelectedProjectId();
  const { toastError } = useToast();

  const entityType = useMemo(() => mapContentTypeToEntityType(type), [type]);

  const togglePin = useCallback(async () => {
    if (isLoading || !projectId) {
      return;
    }

    const shouldPin = !isPinned;

    try {
      await togglePinItem({ projectId, entityType, entityId: id, shouldPin }).unwrap();

      if (onSuccess) {
        onSuccess(id, shouldPin);
      }
    } catch {
      // Show error toast - optimistic update is automatically reverted at API level
      toastError(shouldPin ? 'Failed to pin item' : 'Failed to unpin item');
    }
  }, [isLoading, isPinned, togglePinItem, id, projectId, entityType, onSuccess, toastError]);

  return {
    togglePin,
    isLoading,
  };
};
