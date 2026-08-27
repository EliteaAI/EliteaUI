import { useMemo } from 'react';

import { useSearchParams } from 'react-router-dom';

import {
  ContentType,
  PUBLIC_PROJECT_ID,
  SearchParams,
  SortFields,
  SortOrderOptions,
} from '@/common/constants';
import AdminIcon from '@/components/Icons/AdminIcon';
import Champion from '@/components/Icons/Champion';
import Fire from '@/components/Icons/Fire';
import HeartIcon from '@/components/Icons/HeartIcon';

import Latest from './Latest';
import MyLiked from './MyLiked';
import PrivateAgentsList from './PrivateAgentsList';
import Trending from './Trending';

const usePublicApplicationTabs = (
  latestTotal,
  myLikedTotal,
  trendingTotal,
  applicationsTotal,
  trendRange,
  hasAdminPermission,
) => {
  const [searchParams] = useSearchParams();

  const sortBy = useMemo(() => searchParams.get(SearchParams.SortBy) || SortFields.CreatedAt, [searchParams]);
  const sortOrder = useMemo(
    () => searchParams.get(SearchParams.SortOrder) || SortOrderOptions.DESC,
    [searchParams],
  );

  return useMemo(
    () => [
      {
        label: 'Latest',
        count: latestTotal,
        icon: <Fire />,
        content: <Latest />,
      },
      {
        label: 'My liked',
        count: myLikedTotal,
        icon: <HeartIcon />,
        content: <MyLiked />,
      },
      {
        label: 'Trending',
        count: trendingTotal,
        icon: <Champion />,
        content: <Trending trendRange={trendRange} />,
      },
      {
        label: 'Admin',
        icon: <AdminIcon />,
        content: (
          <PrivateAgentsList
            sortBy={sortBy}
            sortOrder={sortOrder}
            cardContentType={ContentType.ApplicationAdmin}
          />
        ),
        count: applicationsTotal,
        display: hasAdminPermission ? undefined : 'none',
      },
    ],
    [
      latestTotal,
      myLikedTotal,
      trendingTotal,
      trendRange,
      sortBy,
      sortOrder,
      applicationsTotal,
      hasAdminPermission,
    ],
  );
};

const usePrivateApplicationTabs = applicationsTotal => {
  const [searchParams] = useSearchParams();

  const sortBy = useMemo(() => searchParams.get(SearchParams.SortBy) || SortFields.CreatedAt, [searchParams]);
  const sortOrder = useMemo(
    () => searchParams.get(SearchParams.SortOrder) || SortOrderOptions.DESC,
    [searchParams],
  );

  return useMemo(
    () => [
      {
        label: 'All',
        count: applicationsTotal,
        content: (
          <PrivateAgentsList
            sortBy={sortBy}
            sortOrder={sortOrder}
            cardContentType={ContentType.ApplicationAll}
          />
        ),
      },
    ],
    [applicationsTotal, sortBy, sortOrder],
  );
};

export const useApplicationTabs = (
  projectId,
  latestTotal,
  myLikedTotal,
  trendingTotal,
  applicationsTotal,
  trendRange,
  hasAdminPermission,
) => {
  const publicTabs = usePublicApplicationTabs(
    latestTotal,
    myLikedTotal,
    trendingTotal,
    applicationsTotal,
    trendRange,
    hasAdminPermission,
  );

  const privateTabs = usePrivateApplicationTabs(applicationsTotal);

  return projectId == PUBLIC_PROJECT_ID ? publicTabs : privateTabs;
};
