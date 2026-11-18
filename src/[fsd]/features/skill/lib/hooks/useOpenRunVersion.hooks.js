import { useCallback, useEffect, useRef } from 'react';

import { useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { buildRunVersionSearch } from '@/[fsd]/features/skill/lib/helpers';
import { useToast } from '@/[fsd]/shared/lib/hooks';
import { eliteaApi } from '@/api/eliteaApi';
import { isNotFoundError } from '@/common/utils.jsx';
import RouteDefinitions from '@/routes';

/**
 * Opens a run on the version it used. The callback keeps its identity while the address changes, and builds the
 * new address from the params current once the version is confirmed.
 */
export const useOpenRunVersion = props => {
  const { projectId, skillId, tab, onRunConversationChange } = props;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toastError } = useToast();
  const [searchParams] = useSearchParams();
  const latestSearchParams = useRef(searchParams);

  useEffect(() => {
    latestSearchParams.current = searchParams;
  }, [searchParams]);

  return useCallback(
    async (pinnedVersionId, conversationId) => {
      const freshPinnedVersionRequest = dispatch(
        eliteaApi.endpoints.skillDetails.initiate({ projectId, skillId, versionId: String(pinnedVersionId) }),
      );
      const { error: pinnedVersionError } = await freshPinnedVersionRequest;
      freshPinnedVersionRequest.unsubscribe();
      if (pinnedVersionError && isNotFoundError(pinnedVersionError)) {
        toastError('The version this run used no longer exists; starting a new run');
        onRunConversationChange(null);
        return;
      }
      const search = buildRunVersionSearch(latestSearchParams.current, conversationId);
      navigate(`${RouteDefinitions.Skills}/${tab}/${skillId}/${pinnedVersionId}?${search.toString()}`, {
        replace: true,
      });
    },
    [dispatch, navigate, onRunConversationChange, projectId, skillId, tab, toastError],
  );
};
