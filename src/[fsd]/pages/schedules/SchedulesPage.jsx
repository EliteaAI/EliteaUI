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

  const { data, isError, error } = useGetScheduleListQuery(
    { projectId, page, pageSize },
    { skip: !projectId },
  );

  useEffect(() => {
    if (isError) toastError(buildErrorMessage(error));
  }, [error, isError, toastError]);

  const onPageChange = useCallback((_, newPage) => setPage(newPage), []);
  const onChangePageSize = useCallback(event => {
    setPageSize(event.target.value);
    setPage(0);
  }, []);

  return (
    <Box sx={{ padding: '1rem 1.5rem' }}>
      <SchedulesTable
        rows={isError ? [] : (data?.rows ?? [])}
        total={isError ? 0 : (data?.total ?? 0)}
        page={page}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onChangePageSize={onChangePageSize}
      />
    </Box>
  );
};

export default SchedulesPage;
