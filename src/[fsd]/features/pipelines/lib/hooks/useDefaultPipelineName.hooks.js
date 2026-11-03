import { useMemo, useRef } from 'react';

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

  const resolvedNameRef = useRef(null);
  const isLoading = isFetching && !data;

  const computedName = useMemo(
    () => DefaultPipelineNameHelpers.getDefaultPipelineName(isError ? 0 : data?.total),
    [data?.total, isError],
  );

  // Keep the first resolved name: the refetch after saving the draft must not reinitialise the form
  if (!isLoading && resolvedNameRef.current === null) {
    resolvedNameRef.current = computedName;
  }

  return { defaultName: resolvedNameRef.current ?? computedName, isLoading };
};
