import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import { useTrackEvent } from '@/GA';
import { GA_EVENT_NAMES, GA_EVENT_PARAMS } from '@/[fsd]/shared/lib/constants/analytic.constants';
import { useLikeApplicationMutation, useUnlikeApplicationMutation } from '@/api/applications';
import { eliteaApi } from '@/api/eliteaApi';
import { ViewMode } from '@/common/constants';
import { convertToJson } from '@/common/utils';

export function useLikeApplicationCard({ id, name, is_liked, type, viewMode, onSuccess }) {
  const dispatch = useDispatch();
  const trackEvent = useTrackEvent();
  const { tab } = useParams();
  const queries = useSelector(state => state.eliteaApi.queries);
  const queriesRef = useRef(queries);
  const [likeApplication, { isSuccess: isLikeApplicationSuccess, isLoading: isLoadingLikeApplication }] =
    useLikeApplicationMutation();
  const [
    unlikeApplication,
    { isSuccess: isUnlikeApplicationSuccess, isLoading: isLoadingUnlikeApplication },
  ] = useUnlikeApplicationMutation();
  const isLoading = useMemo(() => {
    return isLoadingLikeApplication || isLoadingUnlikeApplication;
  }, [isLoadingLikeApplication, isLoadingUnlikeApplication]);

  // Update ref when queries change
  useEffect(() => {
    queriesRef.current = queries;
  }, [queries]);

  const handleLikeApplicationClick = useCallback(() => {
    if (viewMode !== ViewMode.Public || isLoading) {
      return;
    }
    if (is_liked) {
      unlikeApplication(id);
      trackEvent(GA_EVENT_NAMES.AGENT_UNLIKED, {
        [GA_EVENT_PARAMS.AGENT_ID]: id || 'unknown',
        [GA_EVENT_PARAMS.AGENT_NAME]: name || 'unknown',
        [GA_EVENT_PARAMS.TIMESTAMP]: new Date().toISOString(),
      });
    } else {
      likeApplication(id);
      trackEvent(GA_EVENT_NAMES.AGENT_LIKED, {
        [GA_EVENT_PARAMS.AGENT_ID]: id || 'unknown',
        [GA_EVENT_PARAMS.AGENT_NAME]: name || 'unknown',
        [GA_EVENT_PARAMS.TIMESTAMP]: new Date().toISOString(),
      });
    }
  }, [viewMode, isLoading, is_liked, likeApplication, id, name, unlikeApplication, trackEvent]);

  useEffect(() => {
    if (isLikeApplicationSuccess) {
      let updatedLikes = 0;
      // Update ALL cached publicApplicationsList entries
      const cacheKeys = Object.keys(queriesRef.current || {});
      const matchingKeys = cacheKeys.filter(
        key => queriesRef.current[key]?.endpointName === 'publicApplicationsList',
      );

      matchingKeys.forEach(cacheKey => {
        try {
          const params = convertToJson(cacheKey.replace('publicApplicationsList', '') || '{}');
          dispatch(
            eliteaApi.util.updateQueryData('publicApplicationsList', params, applicationList => {
              applicationList.rows = applicationList.rows.map(application => {
                if (application.id === id) {
                  application.is_liked = true;
                  if (application.likes) {
                    application.likes += 1;
                  } else {
                    application.likes = 1;
                  }
                  updatedLikes = application.likes;
                }
                return application;
              });
            }),
          );
        } catch {
          // Skip invalid cache entries
        }
      });
      if (onSuccess) {
        onSuccess(id, true, updatedLikes);
      }
    }
  }, [dispatch, id, isLikeApplicationSuccess, onSuccess, type]);

  useEffect(() => {
    if (isUnlikeApplicationSuccess) {
      let updatedLikes = 0;
      // Update ALL cached publicApplicationsList entries
      const cacheKeys = Object.keys(queriesRef.current || {});
      const matchingKeys = cacheKeys.filter(
        key => queriesRef.current[key]?.endpointName === 'publicApplicationsList',
      );

      matchingKeys.forEach(cacheKey => {
        try {
          const params = convertToJson(cacheKey.replace('publicApplicationsList', '') || '{}');
          dispatch(
            eliteaApi.util.updateQueryData('publicApplicationsList', params, applicationList => {
              if (tab === 'my-liked') {
                applicationList.rows = applicationList.rows.filter(application => application.id !== id);
              } else {
                applicationList.rows = applicationList.rows.map(application => {
                  if (application.id === id) {
                    application.is_liked = false;
                    if (application.likes) {
                      application.likes -= 1;
                    } else {
                      application.likes = 0;
                    }
                    updatedLikes = application.likes;
                  }
                  return application;
                });
              }
            }),
          );
        } catch {
          // Skip invalid cache entries
        }
      });
      if (onSuccess) {
        onSuccess(id, false, updatedLikes);
      }
    }
  }, [dispatch, id, isUnlikeApplicationSuccess, onSuccess, tab, type]);

  return {
    handleLikeApplicationClick,
    isLoading,
  };
}
