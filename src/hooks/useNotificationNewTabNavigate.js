import { useMemo } from 'react';

import { resolveHref } from '@/[fsd]/entities/notifications/lib/helpers/notification.helpers';
import { NotificationType, SearchParams } from '@/common/constants';
import RouteDefinitions, { getBasename } from '@/routes';

const useNotificationNewTabNavigate = ({ project_id, id, event_type, indexName }) => {
  const baseUrl = `${window.location.protocol}//${window.location.host}`;
  const basename = getBasename();

  const href = useMemo(() => {
    const urlMap = {
      [NotificationType.ChatUserAdded]: `${RouteDefinitions.Chat}`,
      [NotificationType.BucketExpirationWarning]: RouteDefinitions.Artifacts,
      [NotificationType.PersonalAccessTokenExpiring]: RouteDefinitions.SettingsWithTab.replace(
        ':tab',
        'tokens',
      ),
    };

    const searchMap = {
      [NotificationType.ChatUserAdded]: `?${SearchParams.Conversation}=${id}`,
      [NotificationType.BucketExpirationWarning]: id
        ? `?${SearchParams.Bucket}=${encodeURIComponent(id)}`
        : '',
      [NotificationType.PersonalAccessTokenExpiring]: '',
    };

    // Single source of truth for the index link, so this legacy path cannot drift away from the
    // stored-message renderer and resurrect a target that no route serves.
    if (event_type === NotificationType.IndexDataChanged) {
      return resolveHref(event_type, { toolkit_id: id, index_name: indexName }, project_id);
    }

    const defaultUrl = `${baseUrl}${basename}/${project_id}${urlMap[event_type]}${searchMap[event_type]}`;

    // Settings page is not project-scoped — return without project_id prefix
    if (event_type === NotificationType.PersonalAccessTokenExpiring) {
      return `${baseUrl}${basename}${urlMap[event_type]}`;
    }

    return defaultUrl;
  }, [baseUrl, basename, event_type, id, project_id, indexName]);

  return href;
};

export default useNotificationNewTabNavigate;
