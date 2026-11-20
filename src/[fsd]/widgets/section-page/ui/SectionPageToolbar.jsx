import { forwardRef, memo } from 'react';

import { Box } from '@mui/material';

import { SECTION_PAGE_CONFIG } from '@/[fsd]/widgets/section-page/lib/constants';
import DateRangeSelect from '@/components/DateRangeSelect';
import ViewToggle from '@/components/ViewToggle';

import FilterToggleButton from './FilterToggleButton';
import SectionAddMenu from './SectionAddMenu';
import SectionDiscoverSearch from './SectionDiscoverSearch';
import SectionModeTabs from './SectionModeTabs';
import SectionProjectSearch from './SectionProjectSearch';
import SectionPublicFilter from './SectionPublicFilter';

// Left: Yours|Team / Discover or the Public "Filter by"; right: view switch, search with the filter switch, «+ Add»
const SectionPageToolbar = memo(
  forwardRef((props, ref) => {
    const {
      sectionKey,
      tab,
      onChangeTab,
      showModeTabs = false,
      showPublicFilter = false,
      showAdminView = false,
      isTrending = false,
      isTeam = false,
      isDiscover = false,
      hasFilters = true,
      filtersOpen = false,
      onToggleFilters,
      filterCount = 0,
      discoverQuery,
      onDiscoverQueryChange,
    } = props;
    const { searchPlaceholder, testIdPrefix, searchTestId, tableViewTestId, cardViewTestId } =
      SECTION_PAGE_CONFIG[sectionKey];

    const filterButton = hasFilters ? (
      <FilterToggleButton
        open={filtersOpen}
        onToggle={onToggleFilters}
        count={filterCount}
        testId={`${testIdPrefix}-filters-button`}
      />
    ) : null;

    const styles = sectionPageToolbarStyles();

    return (
      <Box
        ref={ref}
        sx={styles.root}
      >
        {showModeTabs && (
          <SectionModeTabs
            value={tab}
            onChange={onChangeTab}
            isTeam={isTeam}
            testIdPrefix={testIdPrefix}
          />
        )}
        {showPublicFilter && (
          <SectionPublicFilter
            value={tab}
            onChange={onChangeTab}
            showAdmin={showAdminView}
            testIdPrefix={testIdPrefix}
          />
        )}
        {showPublicFilter && isTrending && <DateRangeSelect />}
        <Box sx={styles.grow} />
        {!isDiscover && (
          <ViewToggle
            tableViewTestId={tableViewTestId}
            cardViewTestId={cardViewTestId}
          />
        )}
        {isDiscover ? (
          <SectionDiscoverSearch
            query={discoverQuery}
            onQueryChange={onDiscoverQueryChange}
            placeholder={searchPlaceholder}
            filterButton={filterButton}
          />
        ) : (
          // The search reads the query only on mount: a view switch that resets it must remount the box
          <SectionProjectSearch
            key={tab}
            placeholder={searchPlaceholder}
            testId={searchTestId}
            filterButton={filterButton}
          />
        )}
        <SectionAddMenu sectionKey={sectionKey} />
      </Box>
    );
  }),
);

SectionPageToolbar.displayName = 'SectionPageToolbar';

/** @type {MuiSx} */
const sectionPageToolbarStyles = () => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    minHeight: '2.25rem',
  },
  grow: {
    flex: 1,
  },
});

export default SectionPageToolbar;
