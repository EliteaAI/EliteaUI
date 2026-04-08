import { useSelector } from 'react-redux';

import {
  useTotalApplicationsQuery,
  useTotalMyLikedPublicApplicationsQuery,
  useTotalPublicApplicationsQuery,
  useTotalTrendingPublicApplicationsQuery,
} from '@/api/applications';
import { CollectionStatus, PUBLIC_PROJECT_ID, VITE_USE_AGENT_MODERATION } from '@/common/constants';
import useTags from '@/hooks/useTags';

export const useApplicationsData = (projectId, trendRange, hasAdminPermission) => {
  const { query } = useSelector(state => state.search);
  const { tagList } = useSelector(state => state.tags);
  const { selectedTagIds } = useTags(tagList);

  const baseParams = {
    query,
    tags: selectedTagIds,
    agents_type: 'classic',
  };

  const publicParams = {
    ...baseParams,
    statuses: CollectionStatus.Published,
  };

  // Public project queries
  const { data: latestData } = useTotalPublicApplicationsQuery(
    { params: publicParams },
    { skip: !projectId || projectId != PUBLIC_PROJECT_ID },
  );

  const { data: myLikedData } = useTotalMyLikedPublicApplicationsQuery(
    { params: { ...publicParams, my_liked: true } },
    { skip: !projectId || projectId != PUBLIC_PROJECT_ID },
  );

  const { data: trendingData } = useTotalTrendingPublicApplicationsQuery(
    { params: { ...publicParams, trend_start_period: trendRange } },
    { skip: !projectId || projectId != PUBLIC_PROJECT_ID },
  );

  // Private project queries
  const { data: applicationsData } = useTotalApplicationsQuery(
    {
      projectId,
      params: {
        tags: selectedTagIds,
        query,
        agents_type: 'classic',
      },
    },
    {
      skip: !projectId || (projectId == PUBLIC_PROJECT_ID && !hasAdminPermission),
    },
  );

  const { data: draftApplicationsData } = useTotalApplicationsQuery(
    {
      projectId,
      params: {
        ...baseParams,
        statuses: CollectionStatus.Draft,
      },
    },
    {
      skip: !projectId || projectId == PUBLIC_PROJECT_ID || !VITE_USE_AGENT_MODERATION,
    },
  );

  const { data: publishedApplicationsData } = useTotalApplicationsQuery(
    {
      projectId,
      params: {
        ...baseParams,
        statuses: CollectionStatus.Published,
      },
    },
    {
      skip: !projectId || projectId == PUBLIC_PROJECT_ID || !VITE_USE_AGENT_MODERATION,
    },
  );

  const { data: moderationApplicationsData } = useTotalApplicationsQuery(
    {
      projectId,
      params: {
        ...baseParams,
        statuses: CollectionStatus.OnModeration,
      },
    },
    {
      skip: !projectId || projectId == PUBLIC_PROJECT_ID || !VITE_USE_AGENT_MODERATION,
    },
  );

  const { data: approvalApplicationsData } = useTotalApplicationsQuery(
    {
      projectId,
      params: {
        ...baseParams,
        statuses: CollectionStatus.UserApproval,
      },
    },
    {
      skip: !projectId || projectId == PUBLIC_PROJECT_ID || !VITE_USE_AGENT_MODERATION,
    },
  );

  const { data: rejectedApplicationsData } = useTotalApplicationsQuery(
    {
      projectId,
      params: {
        ...baseParams,
        statuses: CollectionStatus.Rejected,
      },
    },
    {
      skip: !projectId || projectId == PUBLIC_PROJECT_ID || !VITE_USE_AGENT_MODERATION,
    },
  );

  return {
    latestTotal: latestData?.total,
    myLikedTotal: myLikedData?.total,
    trendingTotal: trendingData?.total,
    applicationsTotal: applicationsData?.total,
    draftTotal: draftApplicationsData?.total,
    publishedTotal: publishedApplicationsData?.total,
    moderationTotal: moderationApplicationsData?.total,
    approvalTotal: approvalApplicationsData?.total,
    rejectedTotal: rejectedApplicationsData?.total,
  };
};
