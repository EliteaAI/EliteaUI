import { useCallback, useMemo } from 'react';

import {
  useLazyApplicationDetailsQuery,
  useLazyGetApplicationVersionDetailQuery,
  useLazyPublicApplicationDetailsQuery,
} from '@/api/applications';
import { useLazyToolkitsDetailsQuery } from '@/api/toolkits';
import { ChatParticipantType, PUBLIC_PROJECT_ID } from '@/common/constants';

export const useFetchParticipantDetails = () => {
  const [getApplicationDetail, { isFetching: isFetchingApplication }] = useLazyApplicationDetailsQuery();
  const [getPublicApplicationDetail, { isFetching: isFetchingPublicApplication }] =
    useLazyPublicApplicationDetailsQuery();
  const [getApplicationVersion, { isFetching: isFetchingApplicationVersion }] =
    useLazyGetApplicationVersionDetailQuery();
  const [getToolkitDetail, { isFetching: isFetchingToolkit }] = useLazyToolkitsDetailsQuery();
  const isFetchingParticipant = useMemo(
    () =>
      isFetchingApplication ||
      isFetchingPublicApplication ||
      isFetchingApplicationVersion ||
      isFetchingToolkit,
    [isFetchingApplication, isFetchingApplicationVersion, isFetchingPublicApplication, isFetchingToolkit],
  );

  const fetchOriginalDetails = useCallback(
    async (type, id, projectId, { forceRefetch = false } = {}) => {
      // When forceRefetch is true, bypass RTK Query cache and make fresh server request
      const queryOptions = forceRefetch ? { forceRefetch: true } : undefined;
      switch (type) {
        case ChatParticipantType.Pipelines:
        case ChatParticipantType.Applications: {
          const request = projectId != PUBLIC_PROJECT_ID ? getApplicationDetail : getPublicApplicationDetail;
          const result = await request({ projectId, applicationId: id }, queryOptions);
          return result?.data || {};
        }
        case ChatParticipantType.Toolkits: {
          const result = await getToolkitDetail({ projectId, toolkitId: id }, queryOptions);
          return result?.data || {};
        }
        default:
          break;
      }
      return {};
    },
    [getApplicationDetail, getPublicApplicationDetail, getToolkitDetail],
  );

  const fetchOriginalVersionDetails = useCallback(
    async (type, id, versionId, projectId, versionName) => {
      if (!versionId) {
        return {};
      }
      switch (type) {
        case ChatParticipantType.Pipelines:
        case ChatParticipantType.Applications: {
          if (projectId == PUBLIC_PROJECT_ID) {
            // Published agents: use public_application endpoint with version name
            const result = await getPublicApplicationDetail({ applicationId: id, versionName });
            return result?.data?.version_details || {};
          }
          const result = await getApplicationVersion({ projectId, applicationId: id, versionId });
          return result?.data || {};
        }
        default:
          break;
      }
      return {};
    },
    [getApplicationVersion, getPublicApplicationDetail],
  );

  return {
    fetchOriginalDetails,
    fetchOriginalVersionDetails,
    isFetchingParticipant,
  };
};
