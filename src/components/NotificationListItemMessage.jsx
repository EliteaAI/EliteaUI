import { useCallback } from 'react';

import { Link, Typography } from '@mui/material';

import { NotificationType, PUBLIC_PROJECT_ID, ViewMode } from '@/common/constants';
import useNotificationNavigate from '@/hooks/useNotificationNavigate';
import useNotificationNewTabNavigate from '@/hooks/useNotificationNewTabNavigate.js';
import { getBasename } from '@/routes';

const MAX_NAME_LEN = 33;

const leadingText = (param1, param2) => ({
  [NotificationType.TokenExpiring]: `Token ${param1} will be expired in 5 days. For more details view your `,
  [NotificationType.TokenIsExpired]: `Token ${param1} is expired! For more details view your `,
  [NotificationType.SpendingLimitExpiring]: 'Your spending limit is expiring. For more details view your ',
  [NotificationType.SpendingLimitIsExpired]: 'Your spending limit is expired. For more details view your ',
  [NotificationType.RewardNewLevel]: `Congratulations! You've got ${param1} level of prompt expert!`,
  [NotificationType.UserWasAddedToSomeProjectAsTeammate]: `${param1} added into `,
  [NotificationType.ChatUserAdded]: `${param1} added ${param2} to `,
  [NotificationType.PrivateProjectCreated]: 'Project was successfully created',
  [NotificationType.IndexDataChanged]: param1, // Dynamic message based on index state
  [NotificationType.BucketExpirationWarning]: 'Bucket ',
});

const middleText = {};

const endingText = param => ({
  [NotificationType.ModeratorUnpublish]: ' is unpublished after complaint.',
  [NotificationType.AuthorApproval]: ` is approved by ${param} for publishing.`,
  [NotificationType.AuthorReject]: ` is rejected by ${param}.`,
  [NotificationType.ModeratorApprovalOfVersion]: ' is published.',
  [NotificationType.ModeratorRejectOfVersion]: ' is rejected.',
  [NotificationType.TokenExpiring]: '.',
  [NotificationType.TokenIsExpired]: '.',
  [NotificationType.SpendingLimitIsExpired]: '.',
  [NotificationType.SpendingLimitExpiring]: '.',
  [NotificationType.Rates]: '.',
  [NotificationType.Comments]: '.',
  [NotificationType.ContributorRequestForPublishApprove]: '.',
  [NotificationType.UserWasAddedToSomeProjectAsTeammate]: '.',
  [NotificationType.PrivateProjectCreated]: '.',
  [NotificationType.IndexDataChanged]: '',
  [NotificationType.BucketExpirationWarning]:
    " will start deleting files in 24 hours according to its retention policy (files are removed based on each file's creation date; the bucket itself will remain).",
});
const formatName = name => {
  return name && name.length > MAX_NAME_LEN ? `${name.slice(0, MAX_NAME_LEN)}...` : name || '';
};

const formatIndexMessage = (meta, withLink = false) => {
  const { index_name, error, reindex, indexed, updated } = meta;
  const indexNamePlaceholder = withLink ? '{INDEX_LINK}' : index_name || 'Index';
  const reindexedCount = updated || 0;

  // Check if operation failed
  if (error && error.trim()) {
    return `Index ${indexNamePlaceholder} is failed.`;
  }

  // Check if it's a reindex operation
  if (reindex) {
    // Check if it's scheduled
    const isScheduled = meta.initiator === 'schedule';
    const scheduledText = isScheduled ? ' by schedule' : '';
    return `Index ${indexNamePlaceholder} is successfully reindexed${scheduledText}. { "reindexed": ${reindexedCount}, "indexed": ${indexed || 0} }`;
  }

  // New index created
  return `Index ${indexNamePlaceholder} is successfully created: { "indexed": ${indexed || 0} }`;
};

const MyNewTabLink = ({ linkInfo, needTrim, event_type }) => {
  const { linkText, project_id, id, indexName } = linkInfo;

  const href = useNotificationNewTabNavigate({
    project_id,
    id,
    event_type,
    indexName,
  });

  return (
    <Link
      variant="labelMedium"
      sx={{ textDecoration: 'underline', cursor: 'pointer' }}
      target={'_blank'}
      href={href}
    >
      {needTrim ? formatName(linkText) : linkText}
    </Link>
  );
};

const MyCurrentTabLink = ({ linkInfo, needTrim, onCloseNotificationList, event_type }) => {
  const { linkText, project_id, id, version_id, version_name, indexName } = linkInfo;
  const viewMode = project_id == PUBLIC_PROJECT_ID ? ViewMode.Public : ViewMode.Owner;

  const doNavigate = useNotificationNavigate({
    viewMode,
    id,
    event_type,
    name: linkText,
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
      component={'span'}
      sx={{ textDecoration: 'underline', cursor: 'pointer' }}
      onClick={onClick}
    >
      {needTrim ? formatName(linkText) : linkText}
    </Link>
  );
};

const MyLink = props => {
  const { linkInfo } = props;

  return linkInfo?.isNewTab ? <MyNewTabLink {...props} /> : <MyCurrentTabLink {...props} />;
};

const parseInformation = notification => {
  const { event_type, project_id, meta } = notification;
  switch (event_type) {
    case NotificationType.AgentUnpublished: {
      const reasonSuffix = meta.reason ? ` Reason: ${meta.reason}` : '';
      return {
        event_type,
        leadingTextParam1: '',
        leadingTextParam2: '',
        agentUnpublishedMeta: {
          sourceVersionId: meta.source_version_id,
          sourceApplicationId: meta.source_application_id,
          projectId: notification.project_id,
          reasonSuffix,
        },
        endingTextParam: '',
      };
    }
    case NotificationType.ModeratorApprovalOfVersion:
    case NotificationType.ModeratorRejectOfVersion:
    case NotificationType.ModeratorUnpublish:
    case NotificationType.AuthorApproval:
    case NotificationType.AuthorReject:
    case NotificationType.TokenExpiring:
    case NotificationType.TokenIsExpired:
      return {
        event_type,
        leadingTextParam1: meta.token_name,
        leadingTextParam2: '',
        firstLinkInfo: {
          linkText: 'Configuration',
        },
        endingTextParam: '',
      };
    case NotificationType.SpendingLimitIsExpired:
    case NotificationType.SpendingLimitExpiring:
      return {
        event_type,
        leadingTextParam1: '',
        leadingTextParam2: '',
        firstLinkInfo: {
          linkText: 'settings section',
        },
        endingTextParam: '',
      };
    case NotificationType.Rates:
      return {
        event_type,
        leadingTextParam1: meta.rates_count,
        leadingTextParam2: '',
        firstLinkInfo: {
          linkText: meta.prompt_name,
          id: meta.prompt_id,
          version_id: meta.prompt_version_id,
          project_id,
        },
        endingTextParam: '',
      };
    case NotificationType.Comments:
      return {
        event_type,
        leadingTextParam1: meta.comments_count,
        leadingTextParam2: meta.replies_count,
        firstLinkInfo: {
          linkText: meta.prompt_name,
          id: meta.prompt_id,
          version_id: meta.prompt_version_id,
          project_id,
        },
        endingTextParam: '',
      };
    case NotificationType.RewardNewLevel:
      return {
        event_type,
        leadingTextParam1: meta.new_level,
        leadingTextParam2: '',
        endingTextParam: '',
      };
    case NotificationType.ContributorRequestForPublishApprove:
      return {
        event_type,
        leadingTextParam1: meta.author_name,
        leadingTextParam2: '',
        firstLinkInfo: {
          linkText: meta.prompt_name,
          id: meta.prompt_id,
          version_id: meta.prompt_version_id,
          project_id,
        },
        endingTextParam: '',
      };
    case NotificationType.UserWasAddedToSomeProjectAsTeammate:
      return {
        event_type,
        leadingTextParam1: `${meta.users.join(', ')} ${meta.users.length > 1 ? 'are' : 'is'}`,
        leadingTextParam2: '',
        firstLinkInfo: {
          linkText: meta.project_name,
          project_id,
        },
        endingTextParam: '',
      };
    case NotificationType.ChatUserAdded:
      return {
        event_type,
        leadingTextParam1: meta.initiator_name ? meta.initiator_name : 'You were ',
        leadingTextParam2: meta.initiator_name ? 'you ' : '',
        firstLinkInfo: {
          linkText: meta.conversation_name,
          id: meta.conversation_id,
          project_id,
          isNewTab: true,
        },
        endingTextParam: '',
      };
    case NotificationType.PrivateProjectCreated:
      return {
        event_type,
        leadingTextParam1: '',
        leadingTextParam2: '',
        endingTextParam: '',
      };
    case NotificationType.IndexDataChanged:
      return {
        event_type,
        leadingTextParam1: formatIndexMessage(meta, !!meta.toolkit_id), // Only use link placeholder if toolkit_id exists
        leadingTextParam2: '',
        firstLinkInfo: meta.toolkit_id
          ? {
              linkText: meta.index_name || 'Index',
              id: meta.toolkit_id,
              project_id,
              indexName: meta.index_name,
              isNewTab: true,
            }
          : null,
        endingTextParam: '',
      };
    case NotificationType.BucketExpirationWarning: {
      return {
        event_type,
        leadingTextParam1: '',
        leadingTextParam2: '',
        firstLinkInfo: {
          linkText: meta.bucket_name || 'Bucket',
          id: meta.bucket_name,
          project_id,
          isNewTab: true,
        },
        endingTextParam: '',
      };
    }
    default:
      return {};
  }
};

const NotificationListItemMessage = ({ notification, onCloseNotificationList }) => {
  const {
    event_type,
    leadingTextParam1 = '',
    leadingTextParam2 = '',
    firstLinkInfo,
    hasMiddleText,
    secondLinkInfo,
    endingTextParam = '',
    agentUnpublishedMeta,
  } = parseInformation(notification);

  const textColor = notification.is_seen ? 'text.primary' : 'text.secondary';

  // Special handling for AgentUnpublished — inline version link
  if (event_type === NotificationType.AgentUnpublished && agentUnpublishedMeta) {
    const { sourceVersionId, sourceApplicationId, projectId, reasonSuffix } = agentUnpublishedMeta;
    const baseUrl = `${window.location.protocol}//${window.location.host}`;
    const basename = getBasename();
    const versionHref = `${baseUrl}${basename}/${projectId}/agents/all/${sourceApplicationId}/${sourceVersionId}?viewMode=owner`;
    return (
      <Typography
        variant="bodySmall"
        color="text.secondary"
      >
        {'Unpublished agent version id: '}
        <Link
          variant="bodySmall"
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

  // Special handling for IndexDataChanged to embed link within message text
  if (
    event_type === NotificationType.IndexDataChanged &&
    firstLinkInfo &&
    leadingTextParam1.includes('{INDEX_LINK}')
  ) {
    const parts = leadingTextParam1.split('{INDEX_LINK}');
    return (
      <Typography
        variant="labelMedium"
        sx={{ color: textColor }}
      >
        {parts[0]}
        <MyLink
          linkInfo={firstLinkInfo}
          needTrim={false}
          onCloseNotificationList={onCloseNotificationList}
          event_type={event_type}
        />
        {parts[1]}
        {endingText(endingTextParam)[event_type]}
      </Typography>
    );
  }

  return (
    <Typography
      variant="labelMedium"
      sx={{ color: textColor }}
    >
      {leadingText(leadingTextParam1, leadingTextParam2)[event_type]}
      {firstLinkInfo && (
        <MyLink
          linkInfo={firstLinkInfo}
          needTrim
          onCloseNotificationList={onCloseNotificationList}
          event_type={event_type}
        />
      )}
      {hasMiddleText && middleText[event_type]}
      {secondLinkInfo && (
        <MyLink
          linkInfo={secondLinkInfo}
          needTrim
          onCloseNotificationList={onCloseNotificationList}
          event_type={event_type}
        />
      )}
      {endingText(endingTextParam)[event_type]}
    </Typography>
  );
};

export default NotificationListItemMessage;
