import { memo, useCallback } from 'react';

import { formatDistanceToNow } from 'date-fns';

import { Box, Typography, useTheme } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { useNotificationBulkMarkSeenMutation } from '@/api/notifications';
import MarkReadIcon from '@/assets/icons/mark-read-icon.svg?react';
import MarkUnreadIcon from '@/assets/icons/mark-unread-icon.svg?react';
import { convertTime } from '@/common/convertChatConversationMessages';
import { buildErrorMessage } from '@/common/utils';

import { getIcon } from '../lib/helpers';
import NotificationListItemMessage from './NotificationListItemMessage';

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
    onNotificationSeenChange,
    onCloseNotificationList,
    context = 'list',
  } = props;
  const theme = useTheme();
  const { event_type } = notification;
  const { textVariant } = NOTIFICATION_CONTEXT_STYLES[context] ?? NOTIFICATION_CONTEXT_STYLES.list;
  const styles = notificationListItemStyles(clampLines, context === 'list');

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
        onNotificationSeenChange?.(notification.id, shouldMarkAsRead);
      } catch (err) {
        toastError(buildErrorMessage(err));
      }
    },
    [
      projectId,
      notification.id,
      shouldMarkAsRead,
      bulkMarkSeenNotifications,
      onNotificationSeenChange,
      toastError,
    ],
  );

  return (
    <Box sx={[styles.container, sx]}>
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
      {context === 'list' && (
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
            className="mark-toggle"
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
    borderBottom: `0.0625rem solid ${palette.components.notificationItem.border}`,
    '&:hover': {
      backgroundColor: isContextList ? palette.background.surface.interactive.default : undefined,
    },
    '&:hover .mark-toggle, &:focus-within .mark-toggle': {
      opacity: 1,
    },
  }),
  // Always in the layout, so the text keeps its width and the row does not jump on hover
  markButton: {
    flexShrink: 0,
    alignSelf: 'center',
    opacity: 0,
    transition: 'opacity 0.15s',
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
