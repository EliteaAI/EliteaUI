import * as React from 'react';

import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { useTotalApplicationsQuery } from '@/api/applications';
import { CollectionStatus, ModerationTabs, PUBLIC_PROJECT_ID } from '@/common/constants';
import ApplicationsIcon from '@/components/Icons/ApplicationsIcon';
import ViewToggle from '@/components/ViewToggle';
import RouteDefinitions, { PathSessionMap } from '@/routes';

import StickyTabs from '../../components/StickyTabs';
import ModerationApplicationList from './ModerationApplicationList';

export default function ModerationSpace() {
  const [applicationCount, setApplicationCount] = React.useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { tab = ModerationSpace[0] } = useParams();

  const { data: applicationData } = useTotalApplicationsQuery({
    projectId: PUBLIC_PROJECT_ID,
    params: {
      tags: [],
      sort_by: 'created_at',
      sort_order: 'desc',
      statuses: CollectionStatus.OnModeration,
      agents_type: 'classic',
    },
  });

  const applicationTotal = applicationData?.total;

  const onChangeTab = React.useCallback(
    newTab => {
      const rootPath = RouteDefinitions.ModerationSpace;
      const pagePath = `${rootPath}/${ModerationTabs[newTab]}` + location.search;
      navigate(pagePath, {
        state: {
          routeStack: [
            {
              pagePath,
              breadCrumb: PathSessionMap[RouteDefinitions.ModerationSpace],
            },
          ],
        },
      });
    },
    [location.search, navigate],
  );

  const tabs = [
    {
      label: 'Agents',
      count: applicationCount || applicationTotal,
      fullWidth: true,
      icon: <ApplicationsIcon selected />,
      content: <ModerationApplicationList setTabCount={setApplicationCount} />,
    },
  ];

  return (
    <StickyTabs
      value={ModerationTabs.findIndex(item => item === tab)}
      tabs={tabs}
      onChangeTab={onChangeTab}
      noRightPanel
      middleTabComponent={<ViewToggle />}
    />
  );
}
