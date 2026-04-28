import { Fragment, memo, useMemo } from 'react';

import { Link, Typography } from '@mui/material';

import { parseMessage, resolveHref } from '@/[fsd]/entities/notifications/lib/helpers';

import LegacyNotificationMessage from './LegacyNotificationMessage.jsx';

const NotificationListItemMessage = memo(props => {
  const { notification, onCloseNotificationList, textVariant = 'bodySmall' } = props;
  const textColor = notification.is_seen ? 'text.primary' : 'text.secondary';
  const message = notification.meta?.message;
  const segments = useMemo(() => parseMessage(message), [message]);
  const resolvedHref = resolveHref(notification.event_type, notification.meta, notification.project_id);

  if (message) {
    return (
      <Typography
        variant={textVariant}
        sx={{ color: textColor }}
      >
        {segments.map((segment, index) =>
          segment.isLink && resolvedHref ? (
            <Link
              key={index}
              variant={textVariant}
              sx={{ textDecoration: 'underline', cursor: 'pointer' }}
              href={resolvedHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              {segment.text}
            </Link>
          ) : (
            <Fragment key={index}>{segment.text}</Fragment>
          ),
        )}
      </Typography>
    );
  }

  return (
    <LegacyNotificationMessage
      notification={notification}
      onCloseNotificationList={onCloseNotificationList}
      textVariant={textVariant}
      textColor={textColor}
    />
  );
});

NotificationListItemMessage.displayName = 'NotificationListItemMessage';

export default NotificationListItemMessage;
