import { useCallback } from 'react';

import { Link, Typography } from '@mui/material';

import {
  endingText,
  formatName,
  leadingText,
  middleText,
  parseInformation,
} from '@/[fsd]/entities/notifications/lib/helpers/notificationLegacy.helpers.js';
import { NotificationType, PUBLIC_PROJECT_ID, ViewMode } from '@/common/constants';
import useNotificationNavigate from '@/hooks/useNotificationNavigate';
import useNotificationNewTabNavigate from '@/hooks/useNotificationNewTabNavigate.js';
import { getBasename } from '@/routes';

const MyNewTabLink = props => {
  const { linkInfo, needTrim, event_type } = props;
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

/**
 * Legacy fallback renderer for notifications that pre-date meta.message storage.
 * Remove once all environments have run the backfill migration.
 */
const LegacyNotificationMessage = props => {
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
};

LegacyNotificationMessage.displayName = 'LegacyNotificationMessage';

export default LegacyNotificationMessage;
