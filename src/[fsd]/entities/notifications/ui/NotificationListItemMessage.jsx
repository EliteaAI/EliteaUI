import { Fragment, memo, useMemo } from 'react';

import { Link, Typography } from '@mui/material';

import {
  isProjectMembershipNotification,
  parseMessage,
  resolveHref,
} from '@/[fsd]/entities/notifications/lib/helpers';
import { NotificationType } from '@/common/constants';

import LegacyNotificationMessage from './LegacyNotificationMessage.jsx';

const NotificationListItemMessage = memo(props => {
  const { notification, onCloseNotificationList, textVariant = 'bodySmall' } = props;
  const textColor = notification.is_seen ? 'text.primary' : 'text.secondary';
  const message = notification.meta?.message;
  const segments = useMemo(() => parseMessage(message), [message]);
  const resolvedHref = resolveHref(notification.event_type, notification.meta, notification.project_id);
  const isAddedToProject = notification.event_type === NotificationType.UserWasAddedToSomeProjectAsTeammate;
  const isLegacyMembership = Array.isArray(notification.meta?.users);
  const projectName = notification.meta?.project_name;
  const styles = notificationListItemMessageStyles(notification.is_seen);

  if (
    message &&
    !isLegacyMembership &&
    isProjectMembershipNotification(notification.event_type) &&
    typeof projectName === 'string'
  ) {
    return (
      <Typography
        variant={textVariant}
        sx={[{ color: textColor }, styles.membershipMessage]}
      >
        {isAddedToProject ? 'You have been added to ' : 'You have been removed from '}
        {resolvedHref ? (
          <Link
            variant={textVariant}
            sx={styles.link}
            href={resolvedHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            {projectName}
          </Link>
        ) : (
          projectName
        )}
        {' project.'}
      </Typography>
    );
  }

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
              sx={styles.link}
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

/** @type {MuiSx} */
const notificationListItemMessageStyles = isSeen => ({
  link: ({ palette }) => ({
    textDecoration: 'underline',
    cursor: 'pointer',
    color: isSeen ? palette.text.visitedLink : palette.text.link,
  }),
  membershipMessage: {
    maxWidth: '100%',
    overflowWrap: 'anywhere',
    whiteSpace: 'normal',
  },
});

export default NotificationListItemMessage;
