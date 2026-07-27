import { memo } from 'react';

import { Box, Divider } from '@mui/material';

import CategoryRail from './CategoryRail';

const FEATURED_COUNT = 2;

const CatalogBody = memo(props => {
  const {
    isLoading = false,
    allCategories = [],
    selectedCategories = [],
    groupedItems = {},
    onSelectCategory,
    renderCategory,
    renderNoResults,
    noResultsTitle,
    noResultsDescription,
  } = props;

  const styles = catalogBodyStyles();

  const featuredCategories = allCategories.slice(0, FEATURED_COUNT);
  const categories = allCategories.slice(FEATURED_COUNT);

  // Featured entries past the first (My Liked) act as filters only — they surface as a section
  // in the grid solely when their chip is selected, not in the default view (Trending stays).
  const filterOnlyCategories = featuredCategories.slice(1);

  const renderSections = () => {
    if (isLoading) {
      return (
        <Box sx={styles.loadingContainer}>
          {Array.from({ length: 25 }).map((_, index) => (
            <Box
              key={index}
              sx={styles.loadingSkeleton}
            />
          ))}
        </Box>
      );
    }

    if (Object.keys(groupedItems).length > 0 && renderCategory) {
      return allCategories
        .filter(category => {
          if (filterOnlyCategories.includes(category) && !selectedCategories.includes(category)) {
            return false;
          }
          return groupedItems[category] && groupedItems[category].length > 0;
        })
        .map(category => renderCategory(category, groupedItems[category]));
    }

    return renderNoResults ? renderNoResults(noResultsTitle, noResultsDescription) : null;
  };

  return (
    <Box sx={styles.container}>
      <Box sx={styles.leftColumn}>{renderSections()}</Box>
      <Divider
        orientation="vertical"
        flexItem
        sx={styles.railDivider}
      />
      <Box sx={styles.railWrapper}>
        <CategoryRail
          featuredCategories={featuredCategories}
          categories={categories}
          selectedCategories={selectedCategories}
          onSelectCategory={onSelectCategory}
        />
      </Box>
    </Box>
  );
});

CatalogBody.displayName = 'CatalogBody';

/** @type {MuiSx} */
const catalogBodyStyles = () => ({
  container: ({ palette }) => ({
    display: 'flex',
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    background: palette.background.eliteaDefault,
  }),
  leftColumn: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '1.5rem',
  },
  railDivider: ({ palette }) => ({
    borderColor: palette.border.table,
  }),
  railWrapper: {
    padding: '1.5rem',
    overflowY: 'auto',
  },
  loadingContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  loadingSkeleton: ({ palette }) => ({
    width: '12.75rem',
    height: '2.5rem',
    backgroundColor: palette.background.secondary,
    borderRadius: '0.5rem',
    flexShrink: 0,
    flexGrow: 0,
    animation: 'pulse 1.5s ease-in-out infinite',
    '@keyframes pulse': {
      '0%': { opacity: 1 },
      '50%': { opacity: 0.5 },
      '100%': { opacity: 1 },
    },
  }),
});

export default CatalogBody;
