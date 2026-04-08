import { useCallback, useContext, useEffect, useMemo } from 'react';

import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';

import { StyledTabsContext } from '@/components/StyledTabs';
import { actions as settingsActions } from '@/slices/settings';

export default function useStreamingNavBlocker(isExecutingPredict) {
  const dispatch = useDispatch();
  const { setChatStreamingInfo } = useContext(StyledTabsContext) || {};
  const { agentId } = useParams();
  const entityType = useMemo(() => (agentId ? 'application' : ''), [agentId]);
  const setStreamingBlockNav = useCallback(
    (isStreaming, streamingType) => {
      dispatch(settingsActions.setStreamingBlockNav({ isStreaming, streamingType }));
    },
    [dispatch],
  );

  useEffect(() => {
    setStreamingBlockNav(isExecutingPredict, entityType);
    setChatStreamingInfo && setChatStreamingInfo(isExecutingPredict, entityType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setStreamingBlockNav, isExecutingPredict, entityType]);

  useEffect(() => {
    return () => {
      setStreamingBlockNav(false, '');
    };
  }, [setStreamingBlockNav]);

  return {
    setStreamingBlockNav,
  };
}
