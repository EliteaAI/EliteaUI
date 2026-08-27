import { useSelector } from 'react-redux';

import {
  useTotalApplicationsQuery,
  useTotalMyLikedPublicApplicationsQuery,
  useTotalPublicApplicationsQuery,
  useTotalTrendingPublicApplicationsQuery,
} from '@/api/applications';
import { CollectionStatus, PUBLIC_PROJECT_ID } from '@/common/constants';
import useTags from '@/hooks/useTags';

export const useApplicationsData = (projectId, trendRange, hasAdminPermission) => {
  const { query } = useSelector(state => state.search);
  const { tagList } = useSelector(state => state.tags);
  const { selectedTagIds } = useTags(tagList);

  const publicParams = {
    query,
    tags: selectedTagIds,
    agents_type: 'classic',
    statuses: CollectionStatus.Published,
  };

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

  return {
    latestTotal: latestData?.total,
    myLikedTotal: myLikedData?.total,
    trendingTotal: trendingData?.total,
    applicationsTotal: applicationsData?.total,
  };
};
