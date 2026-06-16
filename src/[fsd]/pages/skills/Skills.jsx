import { memo, useCallback, useEffect, useMemo } from 'react';

import { useLocation, useMatch, useNavigate, useParams } from 'react-router-dom';

import PrivateSkillsList from '@/[fsd]/features/skill/ui/PrivateSkillsList';
import { SkillImportButton } from '@/[fsd]/features/skill/ui/import';
import { ContentType, SkillsTabs } from '@/common/constants';
import StickyTabs from '@/components/StickyTabs';
import ViewToggle from '@/components/ViewToggle';
import RouteDefinitions, { PathSessionMap } from '@/routes';

const Skills = memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state: locationState } = location;
  const { tab = SkillsTabs[0] } = useParams();
  const isCreating = useMatch({ path: RouteDefinitions.CreateSkill });

  const selectedTab = useMemo(() => {
    const index = SkillsTabs.findIndex(item => item === tab);
    return index === -1 ? -1 : index;
  }, [tab]);

  const onChangeTab = useCallback(
    newTab => {
      const pagePath = `${RouteDefinitions.Skills}/${SkillsTabs[newTab]}` + location.search;
      navigate(pagePath, {
        state: {
          ...(locationState || {}),
          routeStack: [
            {
              pagePath,
              breadCrumb: PathSessionMap[RouteDefinitions.Skills],
            },
          ],
        },
      });
    },
    [location.search, navigate, locationState],
  );

  useEffect(() => {
    if (selectedTab === -1 && !isCreating) {
      onChangeTab(0);
    }
  }, [isCreating, onChangeTab, selectedTab]);

  const tabs = useMemo(
    () => [
      {
        label: 'Skills',
        content: <PrivateSkillsList cardContentType={ContentType.SkillAll} />,
      },
    ],
    [],
  );

  return (
    <StickyTabs
      tabs={tabs}
      value={selectedTab === -1 ? 0 : selectedTab}
      onChangeTab={onChangeTab}
      showTitleAndSwitchBySelect
      title="Skills"
      containerStyle={{ padding: '0 1.5rem 0 0' }}
      tabBarStyle={{ padding: '0 0.5rem 0 1.5rem' }}
      middleTabComponent={
        <>
          <SkillImportButton />
          <ViewToggle />
        </>
      }
    />
  );
});

Skills.displayName = 'Skills';

export default Skills;
