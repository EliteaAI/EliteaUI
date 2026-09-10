import { memo } from 'react';

import { Link } from '@mui/material';

import { formatName } from '@/[fsd]/entities/notifications/lib/helpers/notificationLegacy.helpers.js';
import useNotificationNewTabNavigate from '@/hooks/useNotificationNewTabNavigate.js';

const MyNewTabLink = memo(props => {
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
});

MyNewTabLink.displayName = 'MyNewTabLink';

export default MyNewTabLink;
