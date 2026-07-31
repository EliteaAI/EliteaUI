import { useEffect } from 'react';

export const NOTIFICATION_EVENT_NAME = 'notifications_notify';
export const NOTIFICATION_READY_EVENT_NAME = 'notifications_ready';

export const buildNotificationEventsUrl = (baseUrl, projectId) => {
  const normalizedBase = String(baseUrl || '').replace(/\/$/, '');
  return `${normalizedBase}/notifications/events/prompt_lib/${encodeURIComponent(projectId)}`;
};

export const useNotificationEvents = ({ baseUrl, projectId, onNotification, onReady }) => {
  useEffect(() => {
    if (!baseUrl || !projectId || typeof onNotification !== 'function') return undefined;

    const source = new EventSource(buildNotificationEventsUrl(baseUrl, projectId), {
      withCredentials: true,
    });
    source.addEventListener(NOTIFICATION_EVENT_NAME, onNotification);
    if (typeof onReady === 'function') {
      source.addEventListener(NOTIFICATION_READY_EVENT_NAME, onReady);
    }

    return () => {
      source.removeEventListener(NOTIFICATION_EVENT_NAME, onNotification);
      if (typeof onReady === 'function') {
        source.removeEventListener(NOTIFICATION_READY_EVENT_NAME, onReady);
      }
      source.close();
    };
  }, [baseUrl, onNotification, onReady, projectId]);
};
