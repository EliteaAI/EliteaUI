import { PICKER_PAGE_SIZE } from '@/[fsd]/features/pipelines/tool-picker/lib/constants/toolPicker.constants';
import { usePagedPickerList } from '@/[fsd]/features/pipelines/tool-picker/lib/hooks/usePagedPickerList.hooks';
import { useApplicationListQuery } from '@/api/applications';

/** Project agents (`agentsType` "classic") or pipelines ("pipeline") for a picker */
export const useProjectApplicationsList = ({ agentsType, query = '', skip = false }) =>
  usePagedPickerList({
    useListQuery: useApplicationListQuery,
    buildArgs: (projectId, page) => ({
      projectId,
      page,
      pageSize: PICKER_PAGE_SIZE,
      params: { agents_type: agentsType, sort_by: 'created_at', sort_order: 'desc', query },
    }),
    pageSize: PICKER_PAGE_SIZE,
    query,
    skip,
  });
