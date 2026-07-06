import { memo, useCallback, useEffect } from 'react';

import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { Box, Popover, Skeleton, Typography } from '@mui/material';

import { NotificationListItem } from '@/[fsd]/entities/notifications/ui';
import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import {
  TAG_NOTIFICATIONS,
  notificationsApi,
  useNotificationBulkMarkSeenMutation,
  useNotificationListQuery,
} from '@/api/notifications';
import { buildErrorMessage } from '@/common/utils';
import CloseIcon from '@/components/Icons/CloseIcon';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';
import RouteDefinitions, { PathSessionMap } from '@/routes';

const POPOVER_PAGE_SIZE = 5;

const NotificationList = memo(props => {
  const { notificationListAnchorEl, onCloseNotificationList } = props;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { toastError } = useToast();
  const [bulkMarkSeenNotifications] = useNotificationBulkMarkSeenMutation();
  const styles = notificationListStyles();
  const projectId = useSelectedProjectId();

  const { data, isFetching, isError, error, refetch } = useNotificationListQuery(
    {
      projectId,
      page: 0,
      pageSize: POPOVER_PAGE_SIZE,
      params: {
        only_new: true,
      },
    },
    { refetchOnFocus: !!projectId, skip: !projectId },
  );

  const notifications = data?.rows ?? [];

  const onMarkAllAsRead = useCallback(async () => {
    if (!projectId) return;
    try {
      await bulkMarkSeenNotifications({
        projectId,
        ids: 'all',
        isSeen: true,
      }).unwrap();
    } catch (err) {
      toastError(buildErrorMessage(err));
    }
  }, [projectId, bulkMarkSeenNotifications, toastError]);

  const onViewAll = useCallback(() => {
    dispatch(notificationsApi.util.invalidateTags([TAG_NOTIFICATIONS]));
    navigate(RouteDefinitions.SettingsWithTab.replace(':tab', 'notifications'), {
      state: {
        routeStack: [
          {
            pagePath: RouteDefinitions.SettingsWithTab.replace(':tab', 'notifications'),
            breadCrumb: PathSessionMap[RouteDefinitions.Settings],
          },
        ],
      },
    });
    onCloseNotificationList();
  }, [dispatch, navigate, onCloseNotificationList]);

  useEffect(() => {
    if (isError) {
      toastError(buildErrorMessage(error));
    }
  }, [error, isError, toastError]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <Popover
      id="notificationList"
      open={Boolean(notificationListAnchorEl)}
      anchorEl={notificationListAnchorEl}
      onClose={onCloseNotificationList}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
      slotProps={{
        paper: {
          sx: styles.popoverPaper,
        },
      }}
      sx={styles.popover}
    >
      <Box sx={styles.container}>
        <Box sx={styles.header}>
          <Typography
            variant="labelMedium"
            color="text.secondary"
          >
            Notifications
          </Typography>
          <BaseBtn
            variant={BUTTON_VARIANTS.tertiary}
            startIcon={<CloseIcon />}
            onClick={onCloseNotificationList}
            aria-label="Close notifications"
          />
        </Box>
        <Box sx={styles.listContainer}>
          {notifications.map(notification => (
            <NotificationListItem
              key={notification.id}
              notification={notification}
              onCloseNotificationList={onCloseNotificationList}
            />
          ))}
          {isFetching && !notifications.length && (
            <>
              {[...Array(POPOVER_PAGE_SIZE)].map((_, index) => (
                <Skeleton
                  key={`skeleton-${index}`}
                  sx={styles.skeletonItem}
                  variant="rectangular"
                  width="100%"
                  height="2.5rem"
                />
              ))}
            </>
          )}
          {!notifications.length && !isFetching && (
            <Box sx={styles.emptyState}>
              <Typography variant="bodySmall">No new notifications right now</Typography>
            </Box>
          )}
        </Box>
        {notifications.length > 0 && (
          <BaseBtn
            variant={BUTTON_VARIANTS.auxiliary}
            onClick={onMarkAllAsRead}
            sx={styles.markAllButton}
            disabled={!notifications.some(n => !n.is_seen)}
          >
            <Typography
              variant="labelMedium"
              sx={styles.markAllButtonText}
            >
              Mark all as read
            </Typography>
          </BaseBtn>
        )}
        <BaseBtn
          variant={BUTTON_VARIANTS.auxiliary}
          onClick={onViewAll}
          sx={styles.viewAllButton}
        >
          <Typography
            variant="labelMedium"
            sx={styles.viewAllButtonText}
          >
            View all
          </Typography>
        </BaseBtn>
      </Box>
    </Popover>
  );
});

NotificationList.displayName = 'NotificationList';

/** @type {MuiSx} */
const notificationListStyles = () => ({
  popover: {
    background: 'transparent',
    marginTop: '-1.75rem',
    marginLeft: '3.15rem',
  },
  popoverPaper: {
    borderRadius: '0.5rem',
  },
  container: ({ palette }) => ({
    background: palette.background.notificationList,
    borderRadius: '0.5rem',
    width: '20rem',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  }),
  header: ({ palette }) => ({
    display: 'flex',
    padding: '0.75rem 1.25rem',
    alignItems: 'center',
    height: '3rem',
    boxSizing: 'border-box',
    justifyContent: 'space-between',
    borderBottom: `0.0625rem solid ${palette.border.notificationItem}`,
  }),
  listContainer: {
    flex: 'none',
  },
  skeletonItem: ({ palette }) => ({
    '&:not(:last-of-type)': {
      borderBottom: `0.0625rem solid ${palette.border.notificationItem}`,
    },
  }),
  emptyState: ({ palette }) => ({
    display: 'flex',
    padding: '0.75rem 1.25rem',
    alignItems: 'center',
    justifyContent: 'center',
    height: '2.5rem',
    width: '100%',
    gap: '1rem',
    boxSizing: 'border-box',
    borderBottom: `0.0625rem solid ${palette.border.notificationItem}`,
  }),
  markAllButton: ({ palette }) => ({
    height: '3rem',
    borderTop: `0.0625rem solid ${palette.border.notificationItem}`,
    borderRadius: 0,
    '&:disabled': {
      '& > span': {
        color: palette.text.disabled,
      },
    },
    '&:hover': {
      backgroundColor: palette.background.tabButton.default,
      borderRadius: 0,
    },
  }),
  markAllButtonText: ({ palette }) => ({
    color: palette.text.button.showMore,
  }),
  viewAllButton: ({ palette }) => ({
    height: '3rem',
    borderTop: `0.0625rem solid ${palette.border.notificationItem}`,
    borderRadius: '0px',
    '&:hover': {
      backgroundColor: palette.background.tabButton.default,
      borderRadius: '0px',
    },
  }),
  viewAllButtonText: ({ palette }) => ({
    color: palette.text.button.showMore,
  }),
});

export default NotificationList;
