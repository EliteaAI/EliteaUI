import { memo, useCallback, useState } from 'react';

import { formatDistanceToNow } from 'date-fns';

import { Box, Typography, useTheme } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { NotificationListItemMessage } from '@/[fsd]/entities/notifications/ui';
import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { useNotificationBulkMarkSeenMutation } from '@/api/notifications';
import MarkReadIcon from '@/assets/icons/mark-read-icon.svg?react';
import MarkUnreadIcon from '@/assets/icons/mark-unread-icon.svg?react';
import { NotificationType } from '@/common/constants';
import { convertTime } from '@/common/convertChatConversationMessages';
import { buildErrorMessage } from '@/common/utils';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

import AttentionIcon from './Icons/AttentionIcon';
import CommentIcon from './Icons/CommentIcon';
import ErrorIcon from './Icons/ErrorIcon';
import HeartIcon from './Icons/HeartIcon';
import MedalIcon from './Icons/MedalIcon';
import RemoveIcon from './Icons/RemoveIcon';
import SuccessIcon from './Icons/SuccessIcon';
import TrophyOutlinedIcon from './Icons/TrophyOutlinedIcon';

export const getIcon = (type, theme, notification) => {
  switch (type) {
    case NotificationType.PromptModeratorApproval:
    case NotificationType.AuthorApproval:
    case NotificationType.ModeratorApprovalOfVersion:
    case NotificationType.PromptOfSomeProjectWasPublished:
    case NotificationType.NewPromptVersionOfSomeProjectWasPublished:
    case NotificationType.ChatUserAdded:
    case NotificationType.ChatUserMentioned:
    case NotificationType.PrivateProjectCreated:
    case NotificationType.ModerationApproved:
      return <SuccessIcon fill={theme.palette.status.published} />;

    case NotificationType.IndexDataChanged:
      // Show error icon if index operation failed
      return notification?.meta?.error && notification.meta.error.trim() ? (
        <ErrorIcon
          fill={theme.palette.status.rejected}
          size={16}
        />
      ) : (
        <SuccessIcon fill={theme.palette.status.published} />
      );

    case NotificationType.PromptHasAddedToSomeProject:
    case NotificationType.NewPromptVersionOfSomeProjectWasCreated:
    case NotificationType.UserWasAddedToSomeProjectAsTeammate:
      return <SuccessIcon fill={theme.palette.icon.fill.tips} />;

    case NotificationType.PromptModeratorReject:
    case NotificationType.ModeratorUnpublish:
    case NotificationType.AgentUnpublished:
    case NotificationType.AuthorReject:
    case NotificationType.ModeratorRejectOfVersion:
    case NotificationType.PromptOfSomeProjectWasRejected:
    case NotificationType.NewPromptVersionOfSomeProjectWasRejected:
    case NotificationType.ModerationRejected:
      return <RemoveIcon fill={theme.palette.status.rejected} />;

    case NotificationType.TokenIsExpired:
    case NotificationType.SpendingLimitIsExpired:
      return (
        <ErrorIcon
          fill={theme.palette.status.rejected}
          size={16}
        />
      );

    case NotificationType.TokenExpiring:
    case NotificationType.SpendingLimitExpiring:
    case NotificationType.BucketExpirationWarning:
    case NotificationType.PersonalAccessTokenExpiring:
      return (
        <AttentionIcon
          fill={theme.palette.status.onModeration}
          size={16}
        />
      );

    case NotificationType.Rates:
      return (
        <HeartIcon
          fill={theme.palette.icon.fill.tips}
          size={16}
        />
      );

    case NotificationType.Comments:
      return (
        <CommentIcon
          fill={theme.palette.icon.fill.tips}
          size={16}
        />
      );

    case NotificationType.RewardNewLevel:
      return (
        <MedalIcon
          fill={theme.palette.status.published}
          size={16}
        />
      );

    case NotificationType.RewardBadgeToPrompt:
      return (
        <TrophyOutlinedIcon
          fill={theme.palette.status.published}
          size={16}
        />
      );

    default:
      return null;
  }
};

const NOTIFICATION_CONTEXT_STYLES = {
  list: {
    textVariant: 'bodySmall',
  },
  table: {
    textVariant: 'labelMedium',
  },
};

const NotificationListItem = memo(props => {
  const {
    notification,
    showTime = true,
    clampLines = 3,
    showIcon = true,
    sx = {},
    contentSX = {},
    onCloseNotificationList,
    context = 'list',
  } = props;
  const theme = useTheme();
  const { event_type } = notification;
  const { textVariant } = NOTIFICATION_CONTEXT_STYLES[context] ?? NOTIFICATION_CONTEXT_STYLES.list;
  const styles = notificationListItemStyles(clampLines, context === 'list');

  const [isHovered, setIsHovered] = useState(false);
  const projectId = useSelectedProjectId();
  const [bulkMarkSeenNotifications] = useNotificationBulkMarkSeenMutation();
  const { toastError } = useToast();

  const shouldMarkAsRead = !notification.is_seen;
  const markToggleLabel = shouldMarkAsRead ? 'Mark as read' : 'Mark as unread';
  const MarkIcon = shouldMarkAsRead ? MarkReadIcon : MarkUnreadIcon;

  const handleMarkToggle = useCallback(
    async e => {
      e.stopPropagation();
      if (!projectId) return;
      try {
        await bulkMarkSeenNotifications({
          projectId,
          ids: [notification.id],
          isSeen: shouldMarkAsRead,
        }).unwrap();
      } catch (err) {
        toastError(buildErrorMessage(err));
      }
    },
    [projectId, notification.id, shouldMarkAsRead, bulkMarkSeenNotifications, toastError],
  );

  return (
    <Box
      sx={[styles.container, sx]}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {showIcon && <Box sx={styles.iconContainer}>{getIcon(event_type, theme, notification)}</Box>}
      <Box sx={[styles.content, contentSX]}>
        <Box sx={styles.message}>
          <NotificationListItemMessage
            notification={notification}
            onCloseNotificationList={onCloseNotificationList}
            textVariant={textVariant}
          />
        </Box>
        {showTime && (
          <Typography variant="bodySmall">
            {formatDistanceToNow(new Date(convertTime(notification.created_at))) + ' ago'}
          </Typography>
        )}
      </Box>
      {context === 'list' && isHovered && (
        <Tooltip
          title={markToggleLabel}
          enterDelay={1200}
          placement="top"
        >
          <BaseBtn
            variant={BUTTON_VARIANTS.secondary}
            startIcon={<MarkIcon />}
            aria-label={markToggleLabel}
            onClick={handleMarkToggle}
            sx={styles.markButton}
          />
        </Tooltip>
      )}
    </Box>
  );
});

NotificationListItem.displayName = 'NotificationListItem';

/** @type {MuiSx} */
const notificationListItemStyles = (clampLines, isContextList) => ({
  container: ({ palette }) => ({
    display: 'flex',
    padding: '0.5rem 0.75rem',
    alignItems: 'flex-start',
    height: 'auto',
    width: '100%',
    gap: '0.7rem',
    boxSizing: 'border-box',
    borderBottom: `0.0625rem solid ${palette.border.notificationItem}`,
  }),
  markButton: {
    flexShrink: 0,
    alignSelf: 'center',
  },
  iconContainer: {
    width: '2rem',
    minWidth: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    paddingTop: '0.0625rem',
    alignSelf: isContextList ? 'center' : 'flex-start',
    '& > svg': {
      width: '1.125rem',
      height: '1.125rem',
      display: 'block',
    },
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    overflow: 'hidden',
  },
  message: {
    overflow: 'hidden',
    ...(clampLines
      ? {
          '& > *': {
            display: '-webkit-box',
            WebkitLineClamp: clampLines,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          },
        }
      : {}),
  },
});

export default NotificationListItem;
