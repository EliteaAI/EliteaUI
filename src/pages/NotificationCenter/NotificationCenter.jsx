import { useEffect, useState } from 'react';

import { useSelector } from 'react-redux';

import { Box, Grid } from '@mui/material';

import { useNotificationListQuery } from '@/api/notifications';
import { buildErrorMessage } from '@/common/utils';
import useToast from '@/hooks/useToast';
import { useTheme } from '@emotion/react';

import NotificationTable from './NotificationTable';

export default function NotificationCenter() {
  const theme = useTheme();
  const [rowModesModel] = useState({});
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

  return (
    <>
      <Box
        width={'100%'}
        height={'1px'}
        borderBottom={`1px solid ${theme.palette.border.lines}`}
      />
      <Grid
        container
        px="24px"
        overflow={'scroll'}
        sx={{
          height: 'calc(100vh - 17px)',
          backgroundColor: theme.palette.background.tabPanel,
        }}
      >
        <NotificationTable
          rows={isError ? [] : (data?.rows ?? [])}
          rowCount={data?.total || 0}
          rowModesModel={rowModesModel}
          isFetching={isFetching}
          setPaginationModel={setPaginationModel}
          paginationModel={paginationModel}
        />
      </Grid>
    </>
  );
}
