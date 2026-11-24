import { memo } from 'react';

import { Box, Divider, Skeleton } from '@mui/material';

import { getCardGradientStyles } from '@/utils/cardStyles';

import CategoryRail from './CategoryRail';

const FEATURED_COUNT = 3; // Trending, My Liked, New
const LOADING_CARDS_COUNT = 12;

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
    chipTestIdPrefix,
    showRail = true,
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
        <Box
          sx={styles.loadingContainer}
          data-testid="catalog-loading"
        >
          {Array.from({ length: LOADING_CARDS_COUNT }).map((_, index) => (
            <Box
              key={index}
              sx={styles.loadingCard}
            >
              <Skeleton
                animation="wave"
                variant="rectangular"
                sx={styles.loadingSkeleton}
              />
            </Box>
          ))}
        </Box>
      );
    }

    const visibleCategories = renderCategory
      ? allCategories.filter(category => {
          if (filterOnlyCategories.includes(category) && !selectedCategories.includes(category)) {
            return false;
          }
          return groupedItems[category] && groupedItems[category].length > 0;
        })
      : [];

    if (visibleCategories.length > 0) {
      return visibleCategories.map(category => renderCategory(category, groupedItems[category]));
    }

    return renderNoResults ? renderNoResults(noResultsTitle, noResultsDescription) : null;
  };

  return (
    <Box sx={styles.container}>
      <Box sx={styles.leftColumn}>{renderSections()}</Box>
      {showRail && (
        <>
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
              chipTestIdPrefix={chipTestIdPrefix}
            />
          </Box>
        </>
      )}
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
    background: palette.background.default.primary,
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
    borderColor: palette.border.default,
  }),
  railWrapper: ({ palette }) => ({
    padding: '1.5rem',
    overflowY: 'auto',
    background: palette.background.default.tertiary,
  }),
  // The catalog cards' grid (AgentCategorySection, SkillCategorySection) with the list pages' card skeleton
  loadingContainer: ({ breakpoints }) => ({
    display: 'grid',
    width: '100%',
    maxWidth: '81.375rem',
    gridTemplateColumns: '1fr',
    gap: '1rem',
    [breakpoints.up('sm')]: {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
    [breakpoints.up('prompt_list_md')]: {
      gridTemplateColumns: 'repeat(3, 1fr)',
    },
    [breakpoints.up('prompt_list_xl')]: {
      gridTemplateColumns: 'repeat(4, 1fr)',
    },
  }),
  loadingCard: ({ palette }) => ({
    ...getCardGradientStyles(palette, { enableHover: false }),
    height: '7rem',
  }),
  loadingSkeleton: {
    width: '100%',
    height: '100%',
    borderRadius: '0.75rem',
  },
});

export default CatalogBody;
