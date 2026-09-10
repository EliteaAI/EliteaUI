import { memo } from 'react';

import { Link, Typography } from '@mui/material';

import {
  endingText,
  leadingText,
  middleText,
  parseInformation,
} from '@/[fsd]/entities/notifications/lib/helpers/notificationLegacy.helpers.js';
import { NotificationType } from '@/common/constants';
import { getBasename } from '@/routes';

import MyLink from './MyLink';

const LegacyNotificationMessage = memo(props => {
  const { notification, onCloseNotificationList, textVariant, textColor } = props;
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

  if (
    event_type === NotificationType.IndexDataChanged &&
    firstLinkInfo &&
    leadingTextParam1.includes('{INDEX_LINK}')
  ) {
    const parts = leadingTextParam1.split('{INDEX_LINK}');
    return (
      <Typography
        variant={textVariant}
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
      variant={textVariant}
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
});

LegacyNotificationMessage.displayName = 'LegacyNotificationMessage';

export default LegacyNotificationMessage;
