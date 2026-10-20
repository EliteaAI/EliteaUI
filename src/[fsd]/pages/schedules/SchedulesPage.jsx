import { useCallback, useEffect, useState } from 'react';

import { Box } from '@mui/material';

import { useGetScheduleListQuery } from '@/[fsd]/entities/schedule';
import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import { PAGE_SIZE } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils';

import SchedulesTable from './SchedulesTable';

const SchedulesPage = () => {
  const projectId = useSelectedProjectId();
  const { toastError } = useToast();
  const [page, setPage] = useState(0);
  const [pageProjectId, setPageProjectId] = useState(projectId);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  // A project switch restarts at the first page, before any request for the new project
  if (pageProjectId !== projectId) {
    setPageProjectId(projectId);
    setPage(0);
  }

  // currentData is empty while another project or page loads, so no row of another project shows
  const { currentData, isError, error } = useGetScheduleListQuery(
    { projectId, page, pageSize },
    { skip: !projectId },
  );

  useEffect(() => {
    if (isError) toastError(buildErrorMessage(error));
  }, [error, isError, toastError]);

  const onPageChange = useCallback(newPage => setPage(newPage), []);
  const onChangePageSize = useCallback(size => {
    setPageSize(size);
    setPage(0);
  }, []);

  return (
    <Box sx={{ padding: '1rem 1.5rem' }}>
      <SchedulesTable
        rows={isError ? [] : (currentData?.rows ?? [])}
        total={isError ? 0 : (currentData?.total ?? 0)}
        page={page}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onChangePageSize={onChangePageSize}
      />
    </Box>
  );
};

export default SchedulesPage;
