import { memo, useCallback, useMemo } from 'react';

import { Link, Typography } from '@mui/material';

import {
  NOTIFICATION_TEMPLATES,
  deriveRenderState,
  formatUsersForTemplate,
} from '@/[fsd]/entities/notification';
import { NotificationType, PUBLIC_PROJECT_ID, ViewMode } from '@/common/constants';
import useNotificationNavigate from '@/hooks/useNotificationNavigate';
import useNotificationNewTabNavigate from '@/hooks/useNotificationNewTabNavigate.js';
import { getBasename } from '@/routes';

const MAX_NAME_LEN = 33;

const formatName = name =>
  name && name.length > MAX_NAME_LEN ? `${name.slice(0, MAX_NAME_LEN)}...` : name || '';

/**
 * Resolve a link/linkText placeholder into the flat linkInfo object expected
 * by the navigation hooks. In `linkProps`, string values are treated as meta
 * keys, non-string values (booleans, numbers) are literals. `project_id`
 * falls back to the notification's top-level project_id when not specified.
 */
const resolveLinkInfo = (seg, notification, adaptedMeta) => {
  const resolved = { project_id: notification.project_id };
  Object.entries(seg.linkProps || {}).forEach(([k, v]) => {
    resolved[k] = typeof v === 'string' ? adaptedMeta?.[v] : v;
  });
  const text = seg.label ?? (seg.metaKey ? adaptedMeta?.[seg.metaKey] : undefined) ?? '';
  return { ...resolved, linkText: text };
};

const MyNewTabLink = memo(props => {
  const { linkInfo, needTrim, eventType } = props;
  const { linkText: label, project_id, id, indexName } = linkInfo;

  const href = useNotificationNewTabNavigate({
    project_id,
    id,
    event_type: eventType,
    indexName,
  });

  return (
    <Link
      variant="labelMedium"
      sx={{ textDecoration: 'underline', cursor: 'pointer' }}
      target="_blank"
      href={href}
    >
      {needTrim ? formatName(label) : label}
    </Link>
  );
});
MyNewTabLink.displayName = 'MyNewTabLink';

const MyCurrentTabLink = memo(props => {
  const { linkInfo, needTrim, onCloseNotificationList, eventType } = props;
  const { linkText: label, project_id, id, version_id, version_name, indexName } = linkInfo;
  const viewMode = project_id == PUBLIC_PROJECT_ID ? ViewMode.Public : ViewMode.Owner;

  const doNavigate = useNotificationNavigate({
    viewMode,
    id,
    event_type: eventType,
    name: label,
    version_id,
    version_name,
    indexName,
  });
  const onClick = useCallback(() => {
    doNavigate();
    if (onCloseNotificationList) {
      onCloseNotificationList();
    }
  }, [doNavigate, onCloseNotificationList]);

  return (
    <Link
      variant="labelMedium"
      component="span"
      sx={{ textDecoration: 'underline', cursor: 'pointer' }}
      onClick={onClick}
    >
      {needTrim ? formatName(label) : label}
    </Link>
  );
});
MyCurrentTabLink.displayName = 'MyCurrentTabLink';

const MyLink = memo(props => {
  const { linkInfo } = props;
  return linkInfo?.isNewTab ? <MyNewTabLink {...props} /> : <MyCurrentTabLink {...props} />;
});
MyLink.displayName = 'MyLink';

/**
 * Synthesize meta fields that aren't stored raw on the notification but are
 * needed by templates. Keeps template declarations readable.
 */
const adaptMetaForTemplate = (eventType, meta) => {
  if (!meta) return meta;
  switch (eventType) {
    case NotificationType.IndexDataChanged:
      return { ...meta, _renderState: deriveRenderState(meta) };
    case NotificationType.UserWasAddedToSomeProjectAsTeammate:
      return { ...meta, users: formatUsersForTemplate(meta) };
    default:
      return meta;
  }
};

const pickStatusCase = (seg, adaptedMeta) => {
  const key = adaptedMeta?.[seg.metaKey];
  if (key && seg.cases[key]) return seg.cases[key];
  // Key present but not in the template — BE added a value we haven't mapped
  // yet. Surface it so the gap is noticeable and a template fix gets filed.
  if (key) return `[${key}]`;
  // Key absent (meta unavailable) — nothing meaningful to show.
  return '';
};

const renderTemplate = (tplParsed, notification, adaptedMeta, onCloseNotificationList) =>
  tplParsed.segments.map((seg, i) => {
    switch (seg.type) {
      case 'text':
        return <span key={i}>{seg.text}</span>;
      case 'var':
        return <span key={i}>{adaptedMeta?.[seg.metaKey] ?? ''}</span>;
      case 'link':
      case 'linkText': {
        const linkInfo = resolveLinkInfo(seg, notification, adaptedMeta);
        if (!linkInfo.linkText) return null;
        return (
          <MyLink
            key={i}
            linkInfo={linkInfo}
            needTrim={seg.type === 'link'}
            onCloseNotificationList={onCloseNotificationList}
            eventType={notification.event_type}
          />
        );
      }
      case 'status':
        return <span key={i}>{pickStatusCase(seg, adaptedMeta)}</span>;
      default:
        return null;
    }
  });

// ---------------------------------------------------------------------------
// Legacy rendering path — retained for notification types not yet migrated to
// NOTIFICATION_TEMPLATES. Preserves original behavior byte-for-byte.
// ---------------------------------------------------------------------------

const legacyLeadingText = (param1, param2) => ({
  [NotificationType.ChatUserAdded]: `${param1} added ${param2} to `,
});

const LEGACY_ENDING_TEXT = {
  [NotificationType.Rates]: '.',
  [NotificationType.Comments]: '.',
  [NotificationType.ContributorRequestForPublishApprove]: '.',
  [NotificationType.ChatUserAdded]: '',
};

const parseLegacyInformation = notification => {
  const { event_type, project_id, meta } = notification;
  switch (event_type) {
    case NotificationType.AgentUnpublished: {
      const reasonSuffix = meta.reason ? ` Reason: ${meta.reason}` : '';
      return {
        agentUnpublishedMeta: {
          sourceVersionId: meta.source_version_id,
          sourceApplicationId: meta.source_application_id,
          projectId: notification.project_id,
          reasonSuffix,
        },
      };
    }
    case NotificationType.Rates:
      return {
        leadingTextParam1: meta.rates_count,
        leadingTextParam2: '',
        firstLinkInfo: {
          linkText: meta.prompt_name,
          id: meta.prompt_id,
          version_id: meta.prompt_version_id,
          project_id,
        },
      };
    case NotificationType.Comments:
      return {
        leadingTextParam1: meta.comments_count,
        leadingTextParam2: meta.replies_count,
        firstLinkInfo: {
          linkText: meta.prompt_name,
          id: meta.prompt_id,
          version_id: meta.prompt_version_id,
          project_id,
        },
      };
    case NotificationType.ContributorRequestForPublishApprove:
      return {
        leadingTextParam1: meta.author_name,
        leadingTextParam2: '',
        firstLinkInfo: {
          linkText: meta.prompt_name,
          id: meta.prompt_id,
          version_id: meta.prompt_version_id,
          project_id,
        },
      };
    case NotificationType.ChatUserAdded:
      return {
        leadingTextParam1: meta.initiator_name ? meta.initiator_name : 'You were ',
        leadingTextParam2: meta.initiator_name ? 'you ' : '',
        firstLinkInfo: {
          linkText: meta.conversation_name,
          id: meta.conversation_id,
          project_id,
          isNewTab: true,
        },
      };
    default:
      return {};
  }
};

const LegacyMessage = memo(props => {
  const { notification, onCloseNotificationList, textVariant, textColor } = props;
  const { event_type } = notification;
  const {
    leadingTextParam1 = '',
    leadingTextParam2 = '',
    firstLinkInfo,
    agentUnpublishedMeta,
  } = parseLegacyInformation(notification);

  // Special handling for AgentUnpublished — inline version link
  if (event_type === NotificationType.AgentUnpublished && agentUnpublishedMeta) {
    const { sourceVersionId, sourceApplicationId, projectId, reasonSuffix } = agentUnpublishedMeta;
    const baseUrl = `${window.location.protocol}//${window.location.host}`;
    const basename = getBasename();
    const versionHref = `${baseUrl}${basename}/${projectId}/agents/all/${sourceApplicationId}/${sourceVersionId}?viewMode=owner`;
    return (
      <Typography
        variant={textVariant}
        color="text.secondary"
      >
        {'Unpublished agent version id: '}
        <Link
          variant={textVariant}
          color="text.secondary"
          sx={{ textDecoration: 'underline', cursor: 'pointer' }}
          href={versionHref}
          target="_blank"
        >
          {sourceVersionId}
        </Link>
        {` from project id: ${projectId}.${reasonSuffix}`}
      </Typography>
    );
  }

  return (
    <Typography
      variant={textVariant}
      sx={{ color: textColor }}
    >
      {legacyLeadingText(leadingTextParam1, leadingTextParam2)[event_type]}
      {firstLinkInfo && (
        <MyLink
          linkInfo={firstLinkInfo}
          needTrim
          onCloseNotificationList={onCloseNotificationList}
          eventType={event_type}
        />
      )}
      {LEGACY_ENDING_TEXT[event_type]}
    </Typography>
  );
});
LegacyMessage.displayName = 'LegacyMessage';

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

const NotificationListItemMessage = memo(props => {
  const { notification, onCloseNotificationList, textVariant = 'bodySmall' } = props;
  const { event_type, meta, is_seen } = notification;

  const textColor = is_seen ? 'text.primary' : 'text.secondary';
  const template = NOTIFICATION_TEMPLATES[event_type];

  const adaptedMeta = useMemo(
    () => (template ? adaptMetaForTemplate(event_type, meta) : meta),
    [template, event_type, meta],
  );

  if (!template) {
    return (
      <LegacyMessage
        notification={notification}
        onCloseNotificationList={onCloseNotificationList}
        textVariant={textVariant}
        textColor={textColor}
      />
    );
  }

  return (
    <Typography
      variant={textVariant}
      sx={{ color: textColor }}
    >
      {renderTemplate(template, notification, adaptedMeta, onCloseNotificationList)}
    </Typography>
  );
});
NotificationListItemMessage.displayName = 'NotificationListItemMessage';

export default NotificationListItemMessage;
