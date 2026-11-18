import { useMemo } from 'react';

import { useSelector } from 'react-redux';

import {
  DETAILS_PAGE_COLLAPSE_THRESHOLD,
  DETAILS_PAGE_COLLAPSE_THRESHOLD_WITH_SIDEBAR_OPEN,
  SIDE_BAR_WIDTH,
} from '@/common/constants';

import { useGetWindowWidth } from './useGetWindowWidth.hooks';

// Content width (window minus the open sidebar) below which the tabs collapse
const TABS_COLLAPSE_CONTENT_WIDTH = 1214;

export const useShouldCollapseRightToolbar = () => {
  const { windowWidth } = useGetWindowWidth();
  const sideBarCollapsed = useSelector(state => state.settings.sideBarCollapsed);
  const shouldCollapseRightToolbar = useMemo(
    () =>
      (sideBarCollapsed && windowWidth < DETAILS_PAGE_COLLAPSE_THRESHOLD) ||
      (!sideBarCollapsed && windowWidth < DETAILS_PAGE_COLLAPSE_THRESHOLD_WITH_SIDEBAR_OPEN),
    [sideBarCollapsed, windowWidth],
  );
  const shouldCollapseTabs = useMemo(() => {
    return (
      (sideBarCollapsed && windowWidth < 1220) ||
      (!sideBarCollapsed && windowWidth < TABS_COLLAPSE_CONTENT_WIDTH + SIDE_BAR_WIDTH)
    );
  }, [sideBarCollapsed, windowWidth]);
  return { shouldCollapseRightToolbar, shouldCollapseTabs };
};
