import { memo, useCallback, useEffect, useState } from 'react';

import { useSelector } from 'react-redux';
import { useMatch, useNavigate } from 'react-router-dom';

import { useNotificationListQuery } from '@/api/notifications';
import { sioEvents } from '@/common/constants';
import BellIcon from '@/components/Icons/BellIcon';
import NotificationList from '@/components/NotificationList';
import useSocket from '@/hooks/useSocket';
import RouteDefinitions from '@/routes';
import { useTheme } from '@emotion/react';

import SidebarButton from './SidebarButton';

const NotificationButton = memo(() => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { personal_project_id } = useSelector(state => state.user);
  const isOnNotification = useMatch({ path: RouteDefinitions.NotificationCenter });

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

  const onCloseNotificationList = useCallback(clearDot => {
    setNotificationListAnchorEl(null);
    if (clearDot) {
      setHasMessages(false);
    }
  }, []);

  const onClickNotificationButton = useCallback(
    event => {
      if (!personal_project_id) {
        navigate(RouteDefinitions.Chat);
      } else {
        setNotificationListAnchorEl(event.target);
      }
    },
    [navigate, personal_project_id],
  );

  useEffect(() => {
    if (data?.total) {
      setHasMessages(true);
    }
  }, [data?.total]);

  return (
    <>
      <SidebarButton
        icon={
          <BellIcon
            fill={theme.palette.text.metrics}
            hasMessages={hasMessages}
          />
        }
        label="Notifications"
        tooltip="Notifications"
        onClick={onClickNotificationButton}
        isActive={!!isOnNotification}
      />
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

export default NotificationButton;
