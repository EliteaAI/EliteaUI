import { useMemo } from 'react';

import { NotificationType, SearchParams } from '@/common/constants';
import RouteDefinitions, { getBasename } from '@/routes';

const useNotificationNewTabNavigate = ({ project_id, id, event_type, indexName }) => {
  const baseUrl = `${window.location.protocol}//${window.location.host}`;
  const basename = getBasename();

  const href = useMemo(() => {
    const urlMap = {
      [NotificationType.ChatUserAdded]: `${RouteDefinitions.Chat}`,
      [NotificationType.IndexDataChanged]: RouteDefinitions.ToolkitDetail.replace(':tab', 'indexes').replace(
        ':toolkitId',
        id,
      ),
      [NotificationType.BucketExpirationWarning]: RouteDefinitions.Artifacts,
    };

    const searchMap = {
      [NotificationType.ChatUserAdded]: `?${SearchParams.Conversation}=${id}`,
      [NotificationType.IndexDataChanged]: indexName
        ? `?${SearchParams.IndexName}=${encodeURIComponent(indexName)}`
        : '',
      [NotificationType.BucketExpirationWarning]: id
        ? `?${SearchParams.Bucket}=${encodeURIComponent(id)}`
        : '',
    };

    const defaultUrl = `${baseUrl}${basename}/${project_id}${urlMap[event_type]}${searchMap[event_type]}`;

    return defaultUrl;
  }, [baseUrl, basename, event_type, id, project_id, indexName]);

  return href;
};

export default useNotificationNewTabNavigate;
