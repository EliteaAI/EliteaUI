import { useEffect, useState } from 'react';

import { useSelector } from 'react-redux';

import { Box } from '@mui/material';

import { useNotificationListQuery } from '@/api/notifications';
import { buildErrorMessage } from '@/common/utils';
import useToast from '@/hooks/useToast';

import NotificationTable from './NotificationTable';

export default function NotificationCenter() {
  const { toastError } = useToast();
  const { personal_project_id } = useSelector(state => state.user);

  const [paginationModel, setPaginationModel] = useState({
    pageSize: 50,
    page: 0,
  });

  const { data, isFetching, isError, error } = useNotificationListQuery(
    {
      projectId: personal_project_id,
      page: paginationModel.page,
      pageSize: paginationModel.pageSize,
    },
    { refetchOnFocus: true, skip: !personal_project_id },
  );

  useEffect(() => {
    if (isError) {
      toastError(buildErrorMessage(error));
    }
  }, [error, isError, toastError]);

  const styles = notificationCenterStyles();

  return (
    <Box sx={styles.container}>
      <NotificationTable
        rows={isError ? [] : (data?.rows ?? [])}
        rowCount={data?.total || 0}
        isFetching={isFetching}
        setPaginationModel={setPaginationModel}
        paginationModel={paginationModel}
      />
    </Box>
  );
}

/** @type {MuiSx} */
const notificationCenterStyles = () => ({
  container: ({ palette, spacing }) => ({
    px: spacing(2),
    overflow: 'scroll',
    height: '100vh',
    backgroundColor: palette.background.tabPanel,
  }),
});
