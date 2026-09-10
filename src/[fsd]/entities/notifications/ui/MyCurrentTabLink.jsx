import { memo, useCallback } from 'react';

import { Link } from '@mui/material';

import { formatName } from '@/[fsd]/entities/notifications/lib/helpers/notificationLegacy.helpers.js';
import { PUBLIC_PROJECT_ID, ViewMode } from '@/common/constants';
import useNotificationNavigate from '@/hooks/useNotificationNavigate';

const MyCurrentTabLink = memo(props => {
  const { linkInfo, needTrim, onCloseNotificationList, event_type } = props;
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
});

MyCurrentTabLink.displayName = 'MyCurrentTabLink';

export default MyCurrentTabLink;
