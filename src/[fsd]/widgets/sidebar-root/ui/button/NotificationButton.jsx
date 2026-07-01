import { memo, useCallback, useEffect, useState } from 'react';

import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { Box } from '@mui/material';

import { SIDEBAR_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours/lib/constants';
import NotificationList from '@/[fsd]/widgets/Notifications/ui';
import { useNotificationListQuery } from '@/api/notifications';
import { sioEvents } from '@/common/constants';
import BellIcon from '@/components/Icons/BellIcon';
import useSocket from '@/hooks/useSocket';
import RouteDefinitions from '@/routes';

const NotificationButton = memo(() => {
  const navigate = useNavigate();
  const { personal_project_id } = useSelector(state => state.user);

  const [hasMessages, setHasMessages] = useState(false);
  const [notificationListAnchorEl, setNotificationListAnchorEl] = useState(null);

  const { data } = useNotificationListQuery(
    {
      projectId: personal_project_id,
      page: 0,
      pageSize: 1,
      params: {
        only_new: true,
        only_total: true,
      },
    },
    {
      refetchOnFocus: !!personal_project_id,
      skip: !personal_project_id,
    },
  );

  const onNotificationEvent = useCallback(() => {
    setHasMessages(true);
  }, []);

  useSocket(sioEvents.notifications_notify, onNotificationEvent);

  const onCloseNotificationList = useCallback(() => {
    setNotificationListAnchorEl(null);
  }, []);

  const onClickNotificationButton = useCallback(
    event => {
      if (!personal_project_id) {
        navigate(RouteDefinitions.Chat);
      } else {
        setNotificationListAnchorEl(event.currentTarget);
      }
    },
    [navigate, personal_project_id],
  );

  useEffect(() => {
    if (data !== undefined) {
      setHasMessages(!!data?.total);
    }
  }, [data]);

  return (
    <>
      <Box
        data-tour={SIDEBAR_TOUR_TARGET_IDS.notifications}
        onClick={onClickNotificationButton}
        sx={styles.container}
      >
        <BellIcon hasMessages={hasMessages} />
      </Box>
      {notificationListAnchorEl && (
        <NotificationList
          notificationListAnchorEl={notificationListAnchorEl}
          onCloseNotificationList={onCloseNotificationList}
        />
      )}
    </>
  );
});

NotificationButton.displayName = 'NotificationButton';

/** @type {MuiSx} */
const styles = {
  container: ({ palette }) => ({
    width: '2rem',
    height: '2rem',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: palette.background.button.tertiary.hover,
    },
    '&:active': {
      backgroundColor: palette.background.button.tertiary.pressed,
    },
  }),
};

export default NotificationButton;
