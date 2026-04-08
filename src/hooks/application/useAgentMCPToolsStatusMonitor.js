import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useFormikContext } from 'formik';
import { useDispatch, useSelector } from 'react-redux';

import { eliteaApi } from '@/api/eliteaApi';
import { sioEvents } from '@/common/constants';
import { convertToJson } from '@/common/utils';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useSocket from '@/hooks/useSocket';

export default function useAgentMCPToolsStatusMonitor() {
  const { queries } = useSelector(state => state.eliteaApi);
  const { dirty, setFieldValue, values } = useFormikContext();
  const queriesRef = useRef(queries);
  const dispatch = useDispatch();
  const projectId = useSelectedProjectId();
  const isMCP = useMemo(
    () => (values?.version_details?.tools || []).find(tool => tool.meta?.mcp),
    [values?.version_details?.tools],
  );

  useEffect(() => {
    queriesRef.current = queries;
  }, [queries]);

  const handleMCPStatusEvent = useCallback(
    async message => {
      if (!isMCP) return;

      const { project_id, connected, type } = message;
      if (dirty && projectId === project_id) {
        const currentTools = values?.version_details?.tools || [];
        setFieldValue(
          `version_details.tools`,
          currentTools.map(item => {
            if (item.type === type) {
              return { ...item, online: connected };
            }
            return item;
          }),
        );
      } else {
        const cacheKeys = Object.keys(queriesRef.current || {});
        const foundToolkitListKeys = cacheKeys.filter(
          key => queriesRef.current[key].endpointName === 'applicationDetails',
        );
        foundToolkitListKeys.forEach(key => {
          if (
            projectId === project_id &&
            project_id === queriesRef.current[key].originalArgs.projectId &&
            values?.id === queriesRef.current[key].originalArgs.applicationId
          ) {
            const queryParams = convertToJson(key.replace('applicationDetails', ''));
            const currentTools = values?.version_details?.tools || [];
            dispatch(
              eliteaApi.util.updateQueryData('applicationDetails', queryParams, draft => {
                draft.version_details.tools = currentTools.map(item => {
                  if (item.type === type) {
                    return { ...item, online: connected };
                  }
                  return item;
                });
              }),
            );
          }
        });
      }
    },
    [dirty, dispatch, isMCP, projectId, setFieldValue, values?.id, values?.version_details?.tools],
  );

  useSocket(sioEvents.mcp_status, handleMCPStatusEvent);
}
