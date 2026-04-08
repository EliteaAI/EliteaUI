import { memo } from 'react';

import { formatDistanceToNow } from 'date-fns';

import { Box, Typography, useTheme } from '@mui/material';

import { NotificationType } from '@/common/constants';
import { convertTime } from '@/common/convertChatConversationMessages';

import AttentionIcon from './Icons/AttentionIcon';
import CommentIcon from './Icons/CommentIcon';
import ErrorIcon from './Icons/ErrorIcon';
import HeartIcon from './Icons/HeartIcon';
import MedalIcon from './Icons/MedalIcon';
import RemoveIcon from './Icons/RemoveIcon';
import SuccessIcon from './Icons/SuccessIcon';
import TrophyOutlinedIcon from './Icons/TrophyOutlinedIcon';
import NotificationListItemMessage from './NotificationListItemMessage';

const getIcon = (type, theme, notification) => {
  switch (type) {
    case NotificationType.PromptModeratorApproval:
    case NotificationType.AuthorApproval:
    case NotificationType.ModeratorApprovalOfVersion:
    case NotificationType.PromptOfSomeProjectWasPublished:
    case NotificationType.NewPromptVersionOfSomeProjectWasPublished:
    case NotificationType.ChatUserAdded:
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

const NotificationListItem = memo(props => {
  const {
    notification,
    height = '4.75rem',
    width = '100%',
    showTime = true,
    clampLines = 3,
    sx = {},
    contentSX = {},
    onCloseNotificationList,
  } = props;
  const theme = useTheme();
  const { event_type } = notification;
  const styles = notificationListItemStyles(height, width, clampLines);

  return (
    <Box sx={[styles.container, sx]}>
      <Box sx={styles.iconContainer}>{getIcon(event_type, theme, notification)}</Box>
      <Box sx={[styles.content, contentSX]}>
        <Box sx={styles.message}>
          <NotificationListItemMessage
            notification={notification}
            onCloseNotificationList={onCloseNotificationList}
          />
        </Box>
        {showTime && (
          <Typography variant="bodySmall">
            {formatDistanceToNow(new Date(convertTime(notification.created_at))) + ' ago'}
          </Typography>
        )}
      </Box>
    </Box>
  );
});

NotificationListItem.displayName = 'NotificationListItem';

/** @type {MuiSx} */
const notificationListItemStyles = (height, width, clampLines) => ({
  container: ({ palette }) => ({
    display: 'flex',
    padding: '0.75rem 1.25rem',
    alignItems: 'flex-start',
    minHeight: height,
    width,
    gap: '0.7rem',
    boxSizing: 'border-box',
    borderBottom: `0.0625rem solid ${palette.border.notificationItem}`,
  }),
  iconContainer: {
    width: '1rem',
    minWidth: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    paddingTop: '0.3rem',
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
    ...(clampLines
      ? {
          display: '-webkit-box',
          WebkitLineClamp: clampLines,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }
      : {}),
  },
});

export default NotificationListItem;
