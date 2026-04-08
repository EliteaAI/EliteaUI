import { useCallback, useEffect, useRef, useState } from 'react';

import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { Box, Button, Popover, Skeleton, Typography, debounce, useTheme } from '@mui/material';

import { useNotificationListQuery } from '@/api/notifications';
import { PAGE_SIZE } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils';
import useToast from '@/hooks/useToast';
import RouteDefinitions, { PathSessionMap } from '@/routes';

import CloseIcon from './Icons/CloseIcon';
import NotificationListItem from './NotificationListItem';

const NotificationList = ({ notificationListAnchorEl, onCloseNotificationList }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const listRef = useRef();
  const { toastError } = useToast();
  const { personal_project_id } = useSelector(state => state.user);
  const [page, setPage] = useState(0);
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
    onCloseNotificationList(true);
  }, [navigate, onCloseNotificationList]);
  const onLoadMore = useCallback(() => {
    setPage(prev => prev + 1);
  }, []);

  const onScroll = debounce(() => {
    const listDom = listRef.current;
    const clientHeight = listDom.clientHeight;
    const scrollHeight = listDom.scrollHeight;
    const scrollTop = listDom.scrollTop;

    const isReachBottom = scrollTop + clientHeight > scrollHeight - 10;
    if (isReachBottom && onLoadMore && data && data.rows.length < data.total) {
      onLoadMore();
    }
  }, 300);

  useEffect(() => {
    if (listRef.current) {
      const listDom = listRef.current;
      listDom.addEventListener('scroll', onScroll);

      return () => {
        listDom.removeEventListener('scroll', onScroll);
      };
    }
  }, [onScroll, listRef]);

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
        id={'notificationList'}
        open={Boolean(notificationListAnchorEl)}
        anchorEl={notificationListAnchorEl}
        anchorReference="anchorEl"
        // anchorPosition={{ top: '100vh', left: sideBarCollapsed ? COLLAPSED_SIDE_BAR_WIDTH : SIDE_BAR_WIDTH }}
        onClose={onCloseNotificationList}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        sx={{
          background: 'transparent',
          marginLeft: '30px',
        }}
      >
        <Box
          sx={{
            background: theme.palette.background.notificationList,
            borderRadius: '8px',
            width: '320px',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 'calc(100vh - 120px)',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              padding: '12px 20px',
              alignItems: 'center',
              height: '48px',
              boxSizing: 'border-box',
              justifyContent: 'space-between',
              borderBottom: `1px solid ${theme.palette.border.notificationItem}`,
            }}
          >
            <Typography
              variant="labelMedium"
              color="text.secondary"
            >
              Notifications
            </Typography>
            <Button
              onClick={onCloseNotificationList}
              sx={{
                minWidth: '28px !important',
                padding: '0px 0px !important',
                height: '28px',
                display: 'flex',
                borderRadius: '16px',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
              }}
            >
              <CloseIcon sx={{ cursor: 'pointer', fontSize: '16.5px' }} />
            </Button>
          </Box>
          <Box
            ref={listRef}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              maxHeight: 'calc(100vh - 194px)',
              overflowY: 'scroll',
            }}
          >
            {!isFetching &&
              data?.rows.map(notification => (
                <NotificationListItem
                  key={notification.id}
                  notification={notification}
                  onCloseNotificationList={onCloseNotificationList}
                />
              ))}
            {isFetching && (
              <>
                <Skeleton
                  sx={{
                    '&:not(:last-of-type)': {
                      borderBottom: `1px solid ${theme.palette.border.notificationItem}`,
                    },
                  }}
                  variant="rectangular"
                  width={'100%'}
                  height={40}
                />
                <Skeleton
                  sx={{
                    '&:not(:last-of-type)': {
                      borderBottom: `1px solid ${theme.palette.border.notificationItem}`,
                    },
                  }}
                  variant="rectangular"
                  width={'100%'}
                  height={40}
                />
                <Skeleton
                  sx={{
                    '&:not(:last-of-type)': {
                      borderBottom: `1px solid ${theme.palette.border.notificationItem}`,
                    },
                  }}
                  variant="rectangular"
                  width={'100%'}
                  height={40}
                />
                <Skeleton
                  sx={{
                    '&:not(:last-of-type)': {
                      borderBottom: `1px solid ${theme.palette.border.notificationItem}`,
                    },
                  }}
                  variant="rectangular"
                  width={'100%'}
                  height={40}
                />
                <Skeleton
                  sx={{
                    '&:not(:last-of-type)': {
                      borderBottom: `1px solid ${theme.palette.border.notificationItem}`,
                    },
                  }}
                  variant="rectangular"
                  width={'100%'}
                  height={40}
                />
                <Skeleton
                  sx={{
                    '&:not(:last-of-type)': {
                      borderBottom: `1px solid ${theme.palette.border.notificationItem}`,
                    },
                  }}
                  variant="rectangular"
                  width={'100%'}
                  height={40}
                />
                <Skeleton
                  sx={{
                    '&:not(:last-of-type)': {
                      borderBottom: `1px solid ${theme.palette.border.notificationItem}`,
                    },
                  }}
                  variant="rectangular"
                  width={'100%'}
                  height={40}
                />
                <Skeleton
                  sx={{
                    '&:not(:last-of-type)': {
                      borderBottom: `1px solid ${theme.palette.border.notificationItem}`,
                    },
                  }}
                  variant="rectangular"
                  width={'100%'}
                  height={40}
                />
                <Skeleton
                  sx={{
                    '&:not(:last-of-type)': {
                      borderBottom: `1px solid ${theme.palette.border.notificationItem}`,
                    },
                  }}
                  variant="rectangular"
                  width={'100%'}
                  height={40}
                />
              </>
            )}
            {!data?.rows.length && !isFetching && (
              <Box
                sx={{
                  display: 'flex',
                  padding: '12px 20px',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '40px',
                  width: '100%',
                  gap: '16px',
                  boxSizing: 'border-box',
                  borderBottom: `1px solid ${theme.palette.border.notificationItem}`,
                }}
              >
                <Typography variant="bodySmall">No notifications right now</Typography>
              </Box>
            )}
          </Box>
          <Button
            variant="elitea"
            color="tertiary"
            disableRipple
            onClick={onViewAll}
            sx={{
              display: 'flex',
              padding: '12px 20px',
              alignItems: 'center',
              height: '48px',
              boxSizing: 'border-box',
              justifyContent: 'center',
              cursor: 'pointer',
              marginRight: '0px !important',
              borderRadius: '0px',
              borderWidth: '0px',
              borderTop: `1px solid ${theme.palette.border.notificationItem}`,
              '&:active': {
                border: `0px solid ${theme.palette.border.notificationItem}`,
              },
              '&:hover': {
                borderRadius: '0px',
              },
            }}
          >
            <Typography
              variant="labelMedium"
              sx={{ color: theme.palette.text.button.showMore }}
            >
              View all
            </Typography>
          </Button>
        </Box>
      </Popover>
    </>
  );
};

export default NotificationList;
