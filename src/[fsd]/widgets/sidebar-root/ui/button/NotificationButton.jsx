import { memo, useCallback, useEffect, useState } from 'react';

import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { Box } from '@mui/material';

import { SIDEBAR_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours/lib/constants';
import NotificationList from '@/[fsd]/widgets/Notifications/ui';
import { useNotificationEvents } from '@/[fsd]/widgets/sidebar-root/lib/hooks';
import { useNotificationListQuery } from '@/api/notifications';
import { VITE_SERVER_URL } from '@/common/constants';
import BellIcon from '@/components/Icons/BellIcon';
import RouteDefinitions from '@/routes';

const NotificationButton = memo(() => {
  const navigate = useNavigate();
  const { personal_project_id } = useSelector(state => state.user);

  const [hasMessages, setHasMessages] = useState(false);
  const [notificationListAnchorEl, setNotificationListAnchorEl] = useState(null);

  const { data, refetch } = useNotificationListQuery(
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

  const onNotificationStreamReady = useCallback(() => {
    refetch();
  }, [refetch]);

  useNotificationEvents({
    baseUrl: VITE_SERVER_URL,
    projectId: personal_project_id,
    onNotification: onNotificationEvent,
    onReady: onNotificationStreamReady,
  });

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
    width: '1.75rem',
    height: '1.75rem',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: palette.background.button.tertiary.hover,
      '& svg path': {
        fill: palette.icon.fill.secondary,
      },
    },
    '&:active': {
      backgroundColor: palette.background.button.tertiary.pressed,
    },
  }),
};

export default NotificationButton;
