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
          sx={{ fontSize: '16px' }}
        />
      );
    case NotificationType.Comments:
      return (
        <CommentIcon
          fill={theme.palette.icon.fill.tips}
          sx={{ fontSize: '16px' }}
        />
      );

    case NotificationType.RewardNewLevel:
      return (
        <MedalIcon
          fill={theme.palette.status.published}
          sx={{ fontSize: '16px' }}
        />
      );

    case NotificationType.RewardBadgeToPrompt:
      return (
        <TrophyOutlinedIcon
          fill={theme.palette.status.published}
          sx={{ fontSize: '16px' }}
        />
      );

    default:
      break;
  }
};

const NotificationListItem = ({
  notification,
  height = '76px',
  width = '100%',
  showTime = true,
  sx = {},
  contentSX = {},
  onCloseNotificationList,
}) => {
  const theme = useTheme();
  const { event_type } = notification;
  return (
    <Box
      sx={{
        display: 'flex',
        padding: '12px 20px',
        alignItems: 'center',
        height,
        width,
        gap: '16px',
        boxSizing: 'border-box',
        borderBottom: `1px solid ${theme.palette.border.notificationItem}`,
        ...sx,
      }}
    >
      {getIcon(event_type, theme, notification)}
      <Box
        display="flex"
        flexDirection="column"
        gap="4px"
        sx={{ height: '100%', ...contentSX }}
      >
        <NotificationListItemMessage
          notification={notification}
          onCloseNotificationList={onCloseNotificationList}
        />
        {showTime && (
          <Typography variant="bodySmall">
            {formatDistanceToNow(new Date(convertTime(notification.created_at))) + ' ago'}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default NotificationListItem;
