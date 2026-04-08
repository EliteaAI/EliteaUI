import { useCallback } from 'react';

import { useLazyDatasourceDetailsQuery } from '@/api/datasources.js';
import { buildErrorMessage } from '@/common/utils.jsx';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import { ToolTypes } from '@/pages/Applications/Components/Tools/consts.js';

const validateDatasource = async (editToolDetail, projectId, getDatasourceDetail) => {
  const { data, error } = await getDatasourceDetail(
    {
      projectId,
      datasourceId: editToolDetail?.settings?.datasource_id,
    },
    { skip: !editToolDetail?.settings?.datasource_id },
  );
  if (error || !data?.version_details?.datasource_settings?.chat) {
    const message = error
      ? buildErrorMessage(error)
      : 'The datasource misses llm settings, please make sure all llm settings are set properly';
    return { isValid: false, message };
  }
  return { isValid: true, message: null };
};

export const useExtraValidation = editToolDetail => {
  const projectId = useSelectedProjectId();

  const [getDatasourceDetail] = useLazyDatasourceDetailsQuery();
  // Add other query hooks as needed
  // const [getOtherToolDetail, { isFetching: isFetchingOtherTool }] = useLazyOtherToolDetailsQuery()

  return useCallback(async () => {
    switch (editToolDetail?.type) {
      case ToolTypes.datasource.value:
        // eslint-disable-next-line no-case-declarations
        const { isValid, message } = await validateDatasource(editToolDetail, projectId, getDatasourceDetail);
        return { isValid, message };
      default:
        return { isValid: true, message: null };
    }
  }, [editToolDetail, projectId, getDatasourceDetail]);
};
