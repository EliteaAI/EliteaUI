import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { debounce } from 'lodash';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { Box, CircularProgress, Popover, Skeleton, Typography } from '@mui/material';

import { NotificationListItem } from '@/[fsd]/entities/notifications/ui';
import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { useNotificationPopoverPosition } from '@/[fsd]/widgets/Notifications/lib/hooks';
import {
  TAG_NOTIFICATIONS,
  notificationsApi,
  useNotificationBulkMarkSeenMutation,
  useNotificationListQuery,
} from '@/api/notifications';
import { PAGE_SIZE } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils';
import CloseIcon from '@/components/Icons/CloseIcon';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';
import RouteDefinitions, { PathSessionMap } from '@/routes';

const NotificationList = memo(props => {
  const { notificationListAnchorEl, onCloseNotificationList } = props;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const listRef = useRef();
  const lastAppliedPageRef = useRef(-1);
  const { toastError } = useToast();
  const [bulkMarkSeenNotifications] = useNotificationBulkMarkSeenMutation();
  const styles = notificationListStyles();
  const projectId = useSelectedProjectId();

  const [page, setPage] = useState(0);
  const [allNotifications, setAllNotifications] = useState([]);
  const { popoverPaperRef, popoverPosition } = useNotificationPopoverPosition(notificationListAnchorEl);

  const { data, isFetching, isError, error, refetch } = useNotificationListQuery(
    {
      projectId,
      page,
      pageSize: PAGE_SIZE,
      params: {
        only_new: true,
      },
    },
    { refetchOnFocus: !!projectId, skip: !projectId },
  );

  const onMarkAllAsRead = useCallback(async () => {
    if (!projectId || !allNotifications.length) return;
    const unreadIds = allNotifications.filter(n => !n.is_seen).map(n => n.id);
    if (!unreadIds.length) return;
    try {
      await bulkMarkSeenNotifications({
        projectId,
        ids: unreadIds,
        isSeen: true,
      }).unwrap();
      const unreadIdsSet = new Set(unreadIds);
      setAllNotifications(prev =>
        prev.map(notification =>
          unreadIdsSet.has(notification.id) ? { ...notification, is_seen: true } : notification,
        ),
      );
    } catch (err) {
      toastError(buildErrorMessage(err));
    }
  }, [projectId, allNotifications, bulkMarkSeenNotifications, toastError]);

  const handleNotificationSeenChange = useCallback((notificationId, isSeen) => {
    setAllNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId ? { ...notification, is_seen: isSeen } : notification,
      ),
    );
  }, []);

  const onViewAll = useCallback(() => {
    dispatch(notificationsApi.util.invalidateTags([TAG_NOTIFICATIONS]));
    navigate(RouteDefinitions.NotificationCenter, {
      state: {
        routeStack: [
          {
            pagePath: RouteDefinitions.NotificationCenter,
            breadCrumb: PathSessionMap[RouteDefinitions.NotificationCenter],
          },
        ],
      },
    });
    onCloseNotificationList();
  }, [dispatch, navigate, onCloseNotificationList]);

  const onLoadMore = useCallback(() => {
    setPage(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (!notificationListAnchorEl) return;
    if (!data?.rows) return;
    if (isFetching) return;
    if (page === 0) {
      if (lastAppliedPageRef.current === 0 && allNotifications.length) return;
      lastAppliedPageRef.current = 0;
      setAllNotifications(data.rows);
      return;
    }
    if (lastAppliedPageRef.current === page) return;
    lastAppliedPageRef.current = page;
    setAllNotifications(prev => [...prev, ...data.rows]);
  }, [allNotifications.length, data?.rows, notificationListAnchorEl, page, isFetching]);

  useEffect(() => {
    if (!notificationListAnchorEl) {
      setPage(0);
      setAllNotifications([]);
      lastAppliedPageRef.current = -1;
    }
  }, [notificationListAnchorEl]);

  const hasMore = data && allNotifications.length < data.total;

  const handleScroll = useCallback(() => {
    const listDom = listRef.current;
    if (!listDom || isFetching) return;

    const { clientHeight, scrollHeight, scrollTop } = listDom;
    const isReachBottom = scrollTop + clientHeight > scrollHeight - 10;
    if (isReachBottom && hasMore) {
      onLoadMore();
    }
  }, [hasMore, isFetching, onLoadMore]);

  const debouncedScroll = useMemo(() => debounce(handleScroll, 300), [handleScroll]);

  useEffect(() => {
    const listDom = listRef.current;
    if (!listDom) return;

    listDom.addEventListener('scroll', debouncedScroll);
    return () => {
      listDom.removeEventListener('scroll', debouncedScroll);
      debouncedScroll.cancel();
    };
  }, [debouncedScroll]);

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
      anchorEl={popoverPosition.anchorReference === 'anchorEl' ? notificationListAnchorEl : null}
      anchorReference={popoverPosition.anchorReference}
      anchorPosition={popoverPosition.anchorPosition}
      onClose={onCloseNotificationList}
      anchorOrigin={popoverPosition.anchorOrigin}
      transformOrigin={popoverPosition.transformOrigin}
      slotProps={{
        paper: {
          ref: popoverPaperRef,
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
        <Box
          ref={listRef}
          sx={styles.listContainer}
        >
          {allNotifications.map(notification => (
            <NotificationListItem
              key={notification.id}
              notification={notification}
              onNotificationSeenChange={handleNotificationSeenChange}
              onCloseNotificationList={onCloseNotificationList}
            />
          ))}
          {isFetching && !allNotifications.length && (
            <>
              {[...Array(8)].map((_, index) => (
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
          {!allNotifications.length && !isFetching && (
            <Box sx={styles.emptyState}>
              <Typography variant="bodySmall">No new notifications right now</Typography>
            </Box>
          )}
        </Box>
        {isFetching && page > 0 && (
          <Box sx={styles.loadMoreSpinner}>
            <CircularProgress
              size="1.25rem"
              thickness={4}
            />
          </Box>
        )}
        {allNotifications.length > 0 && (
          <BaseBtn
            variant={BUTTON_VARIANTS.auxiliary}
            onClick={onMarkAllAsRead}
            sx={styles.markAllButton}
            disabled={!allNotifications.some(n => !n.is_seen)}
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
    marginLeft: '1.875rem',
  },
  container: ({ palette }) => ({
    background: palette.background.notificationList,
    borderRadius: '0.5rem',
    width: '20rem',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 'calc(100vh - 7.5rem)',
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
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 'calc(100vh - 12.125rem)',
    overflowY: 'scroll',
  },
  skeletonItem: ({ palette }) => ({
    '&:not(:last-of-type)': {
      borderBottom: `0.0625rem solid ${palette.border.notificationItem}`,
    },
  }),
  loadMoreSpinner: ({ palette }) => ({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '0.75rem 0',
    borderTop: `0.0625rem solid ${palette.border.notificationItem}`,
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
    '&:disabled': {
      '& > span': {
        color: palette.text.disabled,
      },
    },
    '&:hover': {
      backgroundColor: palette.background.tabButton.default,
      borderRadius: '0px',
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
