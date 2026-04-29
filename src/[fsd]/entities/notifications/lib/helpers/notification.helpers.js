import { NotificationType, SearchParams } from '@/common/constants';
import RouteDefinitions, { getBasename } from '@/routes';

/**
 * Resolves the navigation href for an empty-href link segment ([text]()) based on
 * the notification's event_type and meta. Returns a full URL string, or null if
 * the event type has no resolvable link.
 *
 */
export const resolveHref = (eventType, meta, projectId) => {
  const base = `${window.location.protocol}//${window.location.host}${getBasename()}`;

  switch (eventType) {
    case NotificationType.PersonalAccessTokenExpiring:
      return `${base}${RouteDefinitions.SettingsWithTab.replace(':tab', 'tokens')}`;

    case NotificationType.ChatUserAdded: {
      const convId = meta?.conversation_id;
      const route = `${base}/${projectId}${RouteDefinitions.Chat}`;
      return convId ? `${route}?${SearchParams.Conversation}=${convId}` : route;
    }

    case NotificationType.IndexDataChanged: {
      const toolkitId = meta?.toolkit_id;
      const indexName = meta?.index_name;
      if (!toolkitId) return null;
      const route = `${base}/${projectId}${RouteDefinitions.ToolkitDetail.replace(':tab', 'indexes').replace(':toolkitId', toolkitId)}`;
      return indexName ? `${route}?${SearchParams.IndexName}=${encodeURIComponent(indexName)}` : route;
    }

    case NotificationType.BucketExpirationWarning: {
      const bucketName = meta?.bucket_name;
      const route = `${base}/${projectId}${RouteDefinitions.Artifacts}`;
      return bucketName ? `${route}?${SearchParams.Bucket}=${encodeURIComponent(bucketName)}` : route;
    }

    case NotificationType.AgentUnpublished: {
      const appId = meta?.source_application_id;
      const versionId = meta?.source_version_id;
      const agentProjectId = meta?.project_id || projectId;
      if (appId && versionId) {
        return `${base}/${agentProjectId}/agents/all/${appId}/${versionId}?viewMode=owner`;
      }
      return null;
    }

    default:
      return null;
  }
};

/**
 * Parses a stored notification message into renderable segments.
 * Link syntax: [visible text]() — empty href, URL resolved at render time by resolveHref.
 *
 */
export const parseMessage = message => {
  if (!message) return [];
  const segments = [];
  const linkRegex = /\[([^\]]+)\]\([^)]*\)/g;
  let lastIndex = 0;
  let match;
  while ((match = linkRegex.exec(message)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: message.slice(lastIndex, match.index) });
    }
    segments.push({ text: match[1], isLink: true });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < message.length) {
    segments.push({ text: message.slice(lastIndex) });
  }
  return segments.length > 0 ? segments : [{ text: message }];
};
