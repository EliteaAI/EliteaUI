import { memo, useCallback, useMemo, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { ELITEA_CATALOG_TOUR_ID } from '@/[fsd]/features/interactive-tours';
import { ListLayoutContext, useInteractiveTour } from '@/[fsd]/shared/lib/context';
import { PUBLIC_VIEWS, SECTION_PAGE_CONFIG } from '@/[fsd]/widgets/section-page/lib/constants';
import {
  useElementBottom,
  useSectionFilterCount,
  useSectionMode,
} from '@/[fsd]/widgets/section-page/lib/hooks';
import { useHasAdminPermissionOfThisEntity } from '@/hooks/users/usePermissions';

import SectionPageToolbar from './SectionPageToolbar';

// The filter panel starts this far below the toolbar
const PANEL_GAP_PX = 16;

// A section's own page, opened from Explore: title, toolbar, then the project list, the Catalog (Discover)
// or, in the Public project, the view picked in "Filter by"
const SectionPage = memo(props => {
  const { sectionKey, projectContent, renderDiscover, publicViews } = props;
  const { title, testIdPrefix, hasDiscover } = SECTION_PAGE_CONFIG[sectionKey];
  const hasPublicViews = Boolean(publicViews);

  const { tab, isPublic, isTeam, isDiscover, onChangeTab } = useSectionMode(sectionKey, hasPublicViews);
  const hasAdminPermission = useHasAdminPermissionOfThisEntity('agents');
  const tour = useInteractiveTour();
  const projectFilterCount = useSectionFilterCount();
  const { ref: toolbarRef, bottom: toolbarBottom } = useElementBottom();

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [discoverQuery, setDiscoverQuery] = useState('');
  const [discoverFilterCount, setDiscoverFilterCount] = useState(0);

  // The Catalog tour points at the categories, so they stay in view while it runs
  const isCatalogTourRunning = isDiscover && tour?.tourId === ELITEA_CATALOG_TOUR_ID;
  const isFiltersOpen = filtersOpen || isCatalogTourRunning;

  const onToggleFilters = useCallback(() => setFiltersOpen(open => !open), []);

  const listLayout = useMemo(
    () => ({
      isRightPanelOpen: isFiltersOpen,
      rightPanelTop: toolbarBottom + PANEL_GAP_PX,
      isSearchInToolbar: true,
    }),
    [isFiltersOpen, toolbarBottom],
  );

  const showPublicFilter = isPublic && hasPublicViews;

  const content = useMemo(() => {
    if (showPublicFilter) return publicViews[tab] ?? null;
    if (isDiscover) {
      return renderDiscover?.({
        query: discoverQuery,
        showFilters: isFiltersOpen,
        onFilterCountChange: setDiscoverFilterCount,
      });
    }
    return projectContent;
  }, [
    discoverQuery,
    isDiscover,
    isFiltersOpen,
    projectContent,
    publicViews,
    renderDiscover,
    showPublicFilter,
    tab,
  ]);

  const styles = sectionPageStyles();

  return (
    <ListLayoutContext.Provider value={listLayout}>
      <Box sx={styles.page}>
        <Typography
          variant="headingLarge"
          component="h1"
          sx={styles.title}
          data-testid={`${testIdPrefix}-page-header`}
        >
          {title}
        </Typography>
        <SectionPageToolbar
          ref={toolbarRef}
          sectionKey={sectionKey}
          tab={tab}
          onChangeTab={onChangeTab}
          showModeTabs={hasDiscover && !isPublic}
          showPublicFilter={showPublicFilter}
          showAdminView={hasAdminPermission}
          isTrending={tab === PUBLIC_VIEWS.trending}
          isTeam={isTeam}
          isDiscover={isDiscover}
          filtersOpen={isFiltersOpen}
          onToggleFilters={onToggleFilters}
          filterCount={isDiscover ? discoverFilterCount : projectFilterCount}
          discoverQuery={discoverQuery}
          onDiscoverQueryChange={setDiscoverQuery}
        />
        <Box
          key={tab}
          sx={isDiscover ? styles.discoverContent : styles.listContent}
          data-testid={`${testIdPrefix}-section-content`}
        >
          {content}
        </Box>
      </Box>
    </ListLayoutContext.Provider>
  );
});

SectionPage.displayName = 'SectionPage';

/** @type {MuiSx} */
const sectionPageStyles = () => ({
  page: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    padding: '1.5rem 1.5rem 0',
    boxSizing: 'border-box',
  },
  title: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  // The cards and the table have their own 1.5rem inset on the left, as under the old tab bar
  listContent: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    marginLeft: '-1.5rem',
  },
  // The Catalog keeps its own full-width layout and scroll
  discoverContent: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
    marginInline: '-1.5rem',
  },
});

export default SectionPage;
