import { memo } from 'react';

import { Box } from '@mui/material';

import { Filter } from '@/[fsd]/shared/ui';

const GroupedCategory = memo(props => {
  const {
    title,
    searchPlaceholder,
    noResultsTitle,
    noResultsDescription,
    isLoading = false,
    allCategories = [],
    selectedCategories = [],
    searchQuery = '',
    groupedItems = {},
    onSearchChange,
    onSelectCategory,
    renderCategory,
    renderNoResults,
    allowEmptyCategory = false,
    slotProps = {
      categoryList: {
        sx: {},
      },
    },
  } = props;

  const styles = componentStyles();

  return (
    <Filter.CategoryFilter
      title={title}
      searchPlaceholder={searchPlaceholder}
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      allCategories={allCategories}
      selectedCategories={selectedCategories}
      onSelectCategory={onSelectCategory}
      slotProps={slotProps}
    >
      {isLoading ? (
        // Loading skeleton for grouped categories
        <Box sx={styles.loadingContainer}>
          {Array.from({ length: 25 }).map((_, index) => (
            <Box
              key={index}
              sx={styles.loadingSkeleton}
            />
          ))}
        </Box>
      ) : Object.keys(groupedItems).length > 0 ? (
        // Display items grouped by category
        renderCategory ? (
          allCategories
            .filter(
              category =>
                (allowEmptyCategory && !selectedCategories.length) ||
                (groupedItems[category] && groupedItems[category].length > 0),
            )
            .map(category => renderCategory(category, groupedItems[category]))
        ) : null
      ) : // No categories or items found message
      renderNoResults ? (
        renderNoResults(noResultsTitle, noResultsDescription)
      ) : null}
    </Filter.CategoryFilter>
  );
});

GroupedCategory.displayName = 'GroupedCategory';

/** @type {MuiSx} */
const componentStyles = () => ({
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

export default GroupedCategory;
