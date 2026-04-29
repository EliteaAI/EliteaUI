// Legacy helpers for pre-backfill notification rendering.
// Remove this file once all environments have run the backfill migration
// and LegacyNotificationMessage is deleted.
import { NotificationType } from '@/common/constants';

const MAX_NAME_LEN = 33;

export const leadingText = (param1, param2) => ({
  [NotificationType.TokenExpiring]: `Token ${param1} will be expired in 5 days. For more details view your `,
  [NotificationType.TokenIsExpired]: `Token ${param1} is expired! For more details view your `,
  [NotificationType.SpendingLimitExpiring]: 'Your spending limit is expiring. For more details view your ',
  [NotificationType.SpendingLimitIsExpired]: 'Your spending limit is expired. For more details view your ',
  [NotificationType.RewardNewLevel]: `Congratulations! You've got ${param1} level of prompt expert!`,
  [NotificationType.UserWasAddedToSomeProjectAsTeammate]: `${param1} added into `,
  [NotificationType.ChatUserAdded]: `${param1} added ${param2} to `,
  [NotificationType.PrivateProjectCreated]: 'Project was successfully created',
  [NotificationType.IndexDataChanged]: param1,
  [NotificationType.BucketExpirationWarning]: 'Bucket ',
  [NotificationType.PersonalAccessTokenExpiring]: `Your personal access token ${param1} will expire in 24 hours. After expiration, it will no longer work. You can delete and recreate a new token if needed. `,
});

export const middleText = {};

export const endingText = param => ({
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
  [NotificationType.PersonalAccessTokenExpiring]: '',
});

export const formatName = name => {
  return name && name.length > MAX_NAME_LEN ? `${name.slice(0, MAX_NAME_LEN)}...` : name || '';
};

export const formatIndexMessage = (meta, withLink = false) => {
  const { index_name, error, reindex, indexed, updated } = meta;
  const indexNamePlaceholder = withLink ? '{INDEX_LINK}' : index_name || 'Index';
  const reindexedCount = updated || 0;

  if (error && error.trim()) {
    return `Index ${indexNamePlaceholder} is failed.`;
  }

  if (reindex) {
    const isScheduled = meta.initiator === 'schedule';
    const scheduledText = isScheduled ? ' by schedule' : '';
    return `Index ${indexNamePlaceholder} is successfully reindexed${scheduledText}. { "reindexed": ${reindexedCount}, "indexed": ${indexed || 0} }`;
  }

  return `Index ${indexNamePlaceholder} is successfully created: { "indexed": ${indexed || 0} }`;
};

export const parseInformation = notification => {
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
        leadingTextParam1: formatIndexMessage(meta, !!meta.toolkit_id),
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
    case NotificationType.PersonalAccessTokenExpiring:
      return {
        event_type,
        leadingTextParam1: meta.token_name,
        leadingTextParam2: '',
        firstLinkInfo: {
          linkText: 'Manage Personal Access Tokens',
          project_id,
          isNewTab: true,
        },
        endingTextParam: '',
      };
    default:
      return {};
  }
};
