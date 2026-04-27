import { useCallback, useEffect, useRef } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { alitaApi } from '@/api/alitaApi';
import { sioEvents } from '@/common/constants';
import { convertToJson } from '@/common/utils';
import useSocket from '@/hooks/useSocket';

export default function useMCPListStatusMonitor({ isMCP }) {
  const { queries } = useSelector(state => state.alitaApi);
  const queriesRef = useRef(queries);
  const dispatch = useDispatch();
  useEffect(() => {
    queriesRef.current = queries;
  }, [queries]);

  const handleMCPStatusEvent = useCallback(
    async message => {
      if (!isMCP) return;

      const { project_id, connected, type } = message;
      const cacheKeys = Object.keys(queriesRef.current || {});
      const foundToolkitListKeys = cacheKeys.filter(
        key => queriesRef.current[key].endpointName === 'toolkitsList',
      );
      foundToolkitListKeys.forEach(key => {
        if (
          project_id === queriesRef.current[key].originalArgs.projectId &&
          queriesRef.current[key].originalArgs.params?.mcp
        ) {
          const queryParams = convertToJson(key.replace('toolkitsList', ''));
          dispatch(
            alitaApi.util.updateQueryData('toolkitsList', queryParams, draft => {
              draft.rows = draft.rows.map(item => {
                if (item.type === type) {
                  return { ...item, online: connected };
                }
                return item;
              });
            }),
          );
        }
      });
    },
    [dispatch, isMCP],
  );

  useSocket(sioEvents.mcp_status, handleMCPStatusEvent);
}
