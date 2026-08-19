import { useCallback } from 'react';

import { useDispatch } from 'react-redux';

import { invalidateIndexesList } from '@/[fsd]/features/toolkits/indexes/api';
import { NotificationType, sioEvents } from '@/common/constants';
import useSocket from '@/hooks/useSocket';

export const isIndexRunNotification = notification =>
  notification?.event_type === NotificationType.IndexDataChanged;

export const concernsToolkit = (notification, toolkitId) => {
  const notifiedToolkitId = notification?.meta?.toolkit_id;
  if (!toolkitId || notifiedToolkitId == null) return true;
  return String(notifiedToolkitId) === String(toolkitId);
};

export const useIndexRunLiveRefresh = ({ toolkitId } = {}) => {
  const dispatch = useDispatch();

  const onNotification = useCallback(
    notification => {
      if (isIndexRunNotification(notification) && concernsToolkit(notification, toolkitId)) {
        dispatch(invalidateIndexesList());
      }
    },
    [dispatch, toolkitId],
  );

  useSocket(sioEvents.notifications_notify, onNotification);
};
