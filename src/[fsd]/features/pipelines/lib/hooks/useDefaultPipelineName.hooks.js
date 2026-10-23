import { useMemo } from 'react';

import { DefaultPipelineNameHelpers } from '@/[fsd]/features/pipelines/lib/helpers';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { useTotalApplicationsQuery } from '@/api/applications';

export const useDefaultPipelineName = () => {
  const projectId = useSelectedProjectId();

  // limit=1 request: only the pipelines total is needed. No forced refetch: create/delete invalidate this
  // cache, and a background refetch would reinitialise the form and wipe what the user already typed.
  const { data, isFetching, isError } = useTotalApplicationsQuery(
    { projectId, params: { agents_type: 'pipeline' } },
    { skip: !projectId },
  );

  const defaultName = useMemo(
    () => DefaultPipelineNameHelpers.getDefaultPipelineName(isError ? 0 : data?.total),
    [data?.total, isError],
  );

  return { defaultName, isLoading: isFetching && !data };
};
