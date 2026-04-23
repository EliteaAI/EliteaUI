import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { debounce } from 'lodash';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { Box, CircularProgress, Popover, Skeleton, Typography } from '@mui/material';

import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { TAG_NOTIFICATIONS, notificationsApi, useNotificationListQuery } from '@/api/notifications';
import { PAGE_SIZE } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils';
import useToast from '@/hooks/useToast';
import RouteDefinitions, { PathSessionMap } from '@/routes';

import CloseIcon from './Icons/CloseIcon';
import NotificationListItem from './NotificationListItem';

const NotificationList = memo(props => {
  const { notificationListAnchorEl, onCloseNotificationList } = props;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const listRef = useRef();
  const lastAppliedPageRef = useRef(-1);
  const { toastError } = useToast();
  const styles = notificationListStyles();
  const { personal_project_id } = useSelector(state => state.user);
  const [page, setPage] = useState(0);
  const [allNotifications, setAllNotifications] = useState([]);

  const { data, isFetching, isError, error, refetch } = useNotificationListQuery(
    {
      projectId: personal_project_id,
      page,
      pageSize: PAGE_SIZE,
      params: {
        only_new: true,
      },
    },
    { refetchOnFocus: !!personal_project_id, skip: !personal_project_id },
  );

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
      lastAppliedPageRef.current = 0;
      setAllNotifications(data.rows);
      return;
    }
    if (lastAppliedPageRef.current === page) return;
    lastAppliedPageRef.current = page;
    setAllNotifications(prev => [...prev, ...data.rows]);
  }, [data?.rows, notificationListAnchorEl, page, isFetching]);

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
    <>
      <Popover
        id="notificationList"
        open={Boolean(notificationListAnchorEl)}
        anchorEl={notificationListAnchorEl}
        anchorReference="anchorEl"
        onClose={onCloseNotificationList}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
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
                <Typography variant="bodySmall">No notifications right now</Typography>
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
          <BaseBtn
            variant={BUTTON_VARIANTS.tertiary}
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
    </>
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
  viewAllButton: ({ palette }) => ({
    width: '100%',
    padding: '0.75rem 1.25rem',
    height: '3rem',
    boxSizing: 'border-box',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderTop: `0.0625rem solid ${palette.border.notificationItem}`,
    borderRadius: '0px',
    '&:hover': {
      borderRadius: '0px',
    },
  }),
  viewAllButtonText: ({ palette }) => ({
    color: palette.text.button.showMore,
  }),
});

export default NotificationList;
