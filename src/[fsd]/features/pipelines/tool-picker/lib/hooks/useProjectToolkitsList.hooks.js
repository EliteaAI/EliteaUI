import { usePagedPickerList } from '@/[fsd]/features/pipelines/tool-picker/lib/hooks/usePagedPickerList.hooks';
import { useToolkitsListQuery } from '@/api/toolkits';
import { PAGE_SIZE_TOOLKITS_DROPDOWN_LIST } from '@/common/constants';

/** Project toolkits (or MCPs) for a picker: server-side search and infinite scroll */
export const useProjectToolkitsList = ({ mcp = false, query = '', skip = false }) =>
  usePagedPickerList({
    useListQuery: useToolkitsListQuery,
    buildArgs: (projectId, page) => ({
      projectId,
      page,
      page_size: PAGE_SIZE_TOOLKITS_DROPDOWN_LIST,
      params: { query, sort_by: 'name', sort_order: 'asc', mcp },
    }),
    pageSize: PAGE_SIZE_TOOLKITS_DROPDOWN_LIST,
    query,
    skip,
  });
