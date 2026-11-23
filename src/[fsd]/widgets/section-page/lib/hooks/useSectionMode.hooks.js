import { useCallback, useEffect, useMemo } from 'react';

import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { useProjectType, useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import {
  PUBLIC_VIEWS,
  SECTION_MODES,
  SECTION_PAGE_CONFIG,
} from '@/[fsd]/widgets/section-page/lib/constants/sectionPage.constants';

// In Public, Discover is not offered as a tab but stays reachable, so catalog share links and tours land there
const getAllowedTabs = (isPublic, hasDiscover, hasPublicViews) => {
  const baseTabs = isPublic && hasPublicViews ? Object.values(PUBLIC_VIEWS) : [SECTION_MODES.project];
  return hasDiscover ? [...baseTabs, SECTION_MODES.discover] : baseTabs;
};

export const useSectionMode = (sectionKey, hasPublicViews = false) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tab } = useParams();
  const projectId = useSelectedProjectId();
  const { isPublic, isTeam } = useProjectType();
  const { title, listRoute, hasDiscover } = SECTION_PAGE_CONFIG[sectionKey];

  const allowedTabs = useMemo(
    () => getAllowedTabs(isPublic, hasDiscover, hasPublicViews),
    [hasDiscover, hasPublicViews, isPublic],
  );
  const isTabAllowed = allowedTabs.includes(tab);
  const currentTab = isTabAllowed ? tab : allowedTabs[0];

  const goToTab = useCallback(
    (nextTab, replace = false) => {
      const pagePath = `${listRoute}/${nextTab}${location.search}`;
      navigate(pagePath, {
        replace,
        state: {
          ...(location.state || {}),
          routeStack: [{ pagePath, breadCrumb: title }],
        },
      });
    },
    [listRoute, location.search, location.state, navigate, title],
  );

  const onChangeTab = useCallback(
    nextTab => {
      if (nextTab && nextTab !== currentTab) goToTab(nextTab);
    },
    [currentTab, goToTab],
  );

  useEffect(() => {
    if (projectId && !isTabAllowed) goToTab(allowedTabs[0], true);
  }, [allowedTabs, goToTab, isTabAllowed, projectId]);

  return {
    tab: currentTab,
    isPublic,
    isTeam,
    isDiscover: currentTab === SECTION_MODES.discover,
    onChangeTab,
  };
};
