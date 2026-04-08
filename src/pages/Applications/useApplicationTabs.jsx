import { useMemo } from 'react';

import { useSearchParams } from 'react-router-dom';

import {
  CollectionStatus,
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
import { StatusDot } from '@/components/StatusDot';

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
            statuses={[CollectionStatus.All]}
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

const usePrivateApplicationTabs = (
  applicationsTotal,
  draftTotal,
  publishedTotal,
  moderationTotal,
  approvalTotal,
  rejectedTotal,
) => {
  const styles = useStyles();

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
            statuses={[CollectionStatus.All]}
            cardContentType={ContentType.ApplicationAll}
          />
        ),
      },
      {
        label: 'Drafts',
        icon: (
          <StatusDot
            sx={styles.statusDot}
            status={CollectionStatus.Draft}
          />
        ),
        content: (
          <PrivateAgentsList
            sortBy={sortBy}
            sortOrder={sortOrder}
            statuses={[CollectionStatus.Draft]}
            cardContentType={ContentType.ApplicationDraft}
          />
        ),
        count: draftTotal,
      },
      {
        label: 'Published',
        icon: (
          <StatusDot
            sx={styles.statusDot}
            status={CollectionStatus.Published}
          />
        ),
        content: (
          <PrivateAgentsList
            sortBy={sortBy}
            sortOrder={sortOrder}
            statuses={[CollectionStatus.Published]}
            cardContentType={ContentType.ApplicationPublished}
          />
        ),
        count: publishedTotal,
      },
      {
        label: 'Moderation',
        icon: (
          <StatusDot
            sx={styles.statusDot}
            status={CollectionStatus.OnModeration}
          />
        ),
        content: (
          <PrivateAgentsList
            sortBy={sortBy}
            sortOrder={sortOrder}
            statuses={[CollectionStatus.OnModeration]}
            cardContentType={ContentType.ApplicationModeration}
          />
        ),
        count: moderationTotal,
      },
      {
        label: 'Approval',
        icon: (
          <StatusDot
            sx={styles.statusDot}
            status={CollectionStatus.UserApproval}
          />
        ),
        content: (
          <PrivateAgentsList
            sortBy={sortBy}
            sortOrder={sortOrder}
            statuses={[CollectionStatus.UserApproval]}
            cardContentType={ContentType.ApplicationApproval}
          />
        ),
        count: approvalTotal,
      },
      {
        label: 'Rejected',
        icon: (
          <StatusDot
            sx={styles.statusDot}
            status={CollectionStatus.Rejected}
          />
        ),
        content: (
          <PrivateAgentsList
            sortBy={sortBy}
            sortOrder={sortOrder}
            statuses={[CollectionStatus.Rejected]}
            cardContentType={ContentType.ApplicationRejected}
          />
        ),
        count: rejectedTotal,
      },
    ],
    [
      applicationsTotal,
      sortBy,
      sortOrder,
      styles.statusDot,
      draftTotal,
      publishedTotal,
      moderationTotal,
      approvalTotal,
      rejectedTotal,
    ],
  );
};

export const useApplicationTabs = (
  projectId,
  latestTotal,
  myLikedTotal,
  trendingTotal,
  applicationsTotal,
  draftTotal,
  publishedTotal,
  moderationTotal,
  approvalTotal,
  rejectedTotal,
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

  const privateTabs = usePrivateApplicationTabs(
    applicationsTotal,
    draftTotal,
    publishedTotal,
    moderationTotal,
    approvalTotal,
    rejectedTotal,
  );

  return projectId == PUBLIC_PROJECT_ID ? publicTabs : privateTabs;
};

const useStyles = () => ({
  statusDot: {
    marginRight: '0.5rem',
  },
});
