import { useMemo } from 'react';

import { useSelector } from 'react-redux';

import {
  DETAILS_PAGE_COLLAPSE_THRESHOLD,
  DETAILS_PAGE_COLLAPSE_THRESHOLD_WITH_SIDEBAR_OPEN,
} from '@/common/constants';

import useGetWindowWidth from './useGetWindowWidth';

export default function useShouldCollapseRightToolbar() {
  const { windowWidth } = useGetWindowWidth();
  const sideBarCollapsed = useSelector(state => state.settings.sideBarCollapsed);
  const shouldCollapseRightToolbar = useMemo(
    () =>
      (sideBarCollapsed && windowWidth < DETAILS_PAGE_COLLAPSE_THRESHOLD) ||
      (!sideBarCollapsed && windowWidth < DETAILS_PAGE_COLLAPSE_THRESHOLD_WITH_SIDEBAR_OPEN),
    [sideBarCollapsed, windowWidth],
  );
  const shouldCollapseTabs = useMemo(() => {
    return (sideBarCollapsed && windowWidth < 1220) || (!sideBarCollapsed && windowWidth < 1430);
  }, [sideBarCollapsed, windowWidth]);
  return { shouldCollapseRightToolbar, shouldCollapseTabs };
}
