import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { useFetchParticipantDetails } from '@/[fsd]/features/chat/participants/lib/hooks';
import { ChatParticipantType } from '@/common/constants';

import ParticipantStatusRunner from './ParticipantStatusRunner';

const ParticipantDetailsContext = createContext(null);

const getCacheKey = (type, id, projectId) => `${type}::${id}::${projectId}`;

const EMPTY_STATUS = Object.freeze({
  hasError: false,
  shouldDisableThisItem: false,
  hasMisconfigurationErrors: false,
  someToolsAreUnavailable: false,
  isPublishedAgentGone: false,
  isVersionUnavailable: false,
  mcpIsDisconnected: false,
  remoteMcpLoggedOut: false,
  hasRemoteMcpLoggedIn: false,
  spOAuthLoggedOut: false,
  spOAuthLoggedIn: false,
  spConfig: null,
});

export const ParticipantDetailsProvider = ({ participants = [], children }) => {
  const fetchingRef = useRef(new Set());

  const { fetchOriginalDetails } = useFetchParticipantDetails();

  const [detailsMap, setDetailsMap] = useState({});
  const [completedKeys, setCompletedKeys] = useState({});
  const [statusMap, setStatusMap] = useState({});

  useEffect(() => {
    for (const p of participants) {
      const { entity_meta, entity_name } = p;
      if (!entity_meta?.id || !entity_meta?.project_id) continue;
      if (entity_name === ChatParticipantType.Users) continue;

      const key = getCacheKey(entity_name, entity_meta.id, entity_meta.project_id);
      if (fetchingRef.current.has(key)) continue;

      fetchingRef.current.add(key);

      fetchOriginalDetails(entity_name, entity_meta.id, entity_meta.project_id).then(data => {
        setDetailsMap(prev => ({ ...prev, [key]: data }));
        setCompletedKeys(prev => ({ ...prev, [key]: true }));
      });
    }
  }, [participants, fetchOriginalDetails]);

  const getDetails = useCallback(
    (type, id, projectId) => detailsMap[getCacheKey(type, id, projectId)] || {},
    [detailsMap],
  );

  const hasFetched = useCallback(
    (type, id, projectId) => !!completedKeys[getCacheKey(type, id, projectId)],
    [completedKeys],
  );

  const updateDetails = useCallback((type, id, projectId, updater) => {
    const key = getCacheKey(type, id, projectId);
    setDetailsMap(prev => ({
      ...prev,
      [key]: typeof updater === 'function' ? updater(prev[key] || {}) : { ...(prev[key] || {}), ...updater },
    }));
  }, []);

  const refetchDetails = useCallback(
    async (type, id, projectId) => {
      const key = getCacheKey(type, id, projectId);
      const data = await fetchOriginalDetails(type, id, projectId, { forceRefetch: true });
      setDetailsMap(prev => ({ ...prev, [key]: data }));
      setCompletedKeys(prev => ({ ...prev, [key]: true }));
      return data;
    },
    [fetchOriginalDetails],
  );

  const setParticipantStatus = useCallback((key, status) => {
    setStatusMap(prev => ({ ...prev, [key]: status }));
  }, []);

  const getParticipantStatus = useCallback(
    (type, id, projectId) => statusMap[getCacheKey(type, id, projectId)] || EMPTY_STATUS,
    [statusMap],
  );

  const hasParticipantError = useCallback(
    (type, id, projectId) => !!statusMap[getCacheKey(type, id, projectId)]?.hasError,
    [statusMap],
  );

  const value = useMemo(
    () => ({
      getDetails,
      hasFetched,
      updateDetails,
      refetchDetails,
      getParticipantStatus,
      hasParticipantError,
    }),
    [getDetails, hasFetched, updateDetails, refetchDetails, getParticipantStatus, hasParticipantError],
  );

  const nonUserParticipants = useMemo(
    () =>
      participants.filter(
        p => p.entity_name !== ChatParticipantType.Users && p.entity_meta?.id && p.entity_meta?.project_id,
      ),
    [participants],
  );

  return (
    <ParticipantDetailsContext.Provider value={value}>
      {nonUserParticipants.map(p => {
        const key = getCacheKey(p.entity_name, p.entity_meta.id, p.entity_meta.project_id);
        return (
          <ParticipantStatusRunner
            key={key}
            cacheKey={key}
            participant={p}
            originalDetails={detailsMap[key] || {}}
            hasFetchedDetails={!!completedKeys[key]}
            setParticipantStatus={setParticipantStatus}
            updateDetails={updateDetails}
          />
        );
      })}
      {children}
    </ParticipantDetailsContext.Provider>
  );
};

export const useParticipantDetailsContext = () => {
  const context = useContext(ParticipantDetailsContext);
  if (!context) {
    throw new Error('useParticipantDetailsContext must be used within ParticipantDetailsProvider');
  }
  return context;
};
