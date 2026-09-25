import { memo, useRef } from 'react';

import { Box, Chip, Typography } from '@mui/material';

import { SimpleSearchBar } from '@/[fsd]/shared/ui/input';

const CategoryFilter = memo(props => {
  const {
    title,
    searchPlaceholder,
    searchQuery = '',
    onSearchChange,
    allCategories = [],
    selectedCategories = [],
    onSelectCategory,
    children,
    searchInputTestId,
    slotProps = {
      categoryList: {
        sx: {},
      },
    },
  } = props;
  const { categoryList } = slotProps || {};
  const containerRef = useRef(null);

  const styles = componentStyles();

  return (
    <Box sx={styles.container}>
      {/* Title */}
      {title && (
        <Typography
          variant="headingSmall"
          color="text.secondary"
          sx={styles.title}
        >
          {title}
        </Typography>
      )}

      <Box
        data-category-filter-controls=""
        sx={styles.controlsContainer}
      >
        {/* Search Bar */}
        <Box sx={styles.searchContainer(allCategories.length > 1)}>
          <SimpleSearchBar
            placeholder={searchPlaceholder}
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            sx={styles.searchField}
            autoFocus={false}
            data-testid={searchInputTestId}
          />
        </Box>

        {/* Category Filter Chips - only show when multiple categories exist */}
        {allCategories.length > 1 && (
          <Box sx={[styles.categoryFilterContainer, categoryList?.sx]}>
            <Box sx={styles.categoryChipsWrapper}>
              {allCategories.map(category => (
                <Chip
                  key={category}
                  data-testid="category-filter-tab"
                  label={category}
                  clickable
                  onClick={() => onSelectCategory(category)}
                  sx={
                    selectedCategories.includes(category) ? styles.selectedCategoryChip : styles.categoryChip
                  }
                />
              ))}
            </Box>
          </Box>
        )}
      </Box>

      {/* Items Container */}
      <Box
        ref={containerRef}
        sx={styles.itemsContainer}
      >
        {children}
      </Box>
    </Box>
  );
});

CategoryFilter.displayName = 'CategoryFilter';

/** @type {MuiSx} */
const componentStyles = () => ({
  container: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    margin: '0',
    paddingTop: '1.5rem',
    boxSizing: 'border-box',
    overflow: 'hidden',
    backgroundColor: palette.background.default.tertiary,
  }),
  title: {
    marginBottom: '1rem',
  },
  controlsContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  searchContainer: showCategory => ({
    width: '23.75rem',
    marginBottom: showCategory ? '1rem' : '2rem',
  }),
  searchField: {
    width: '100%',
  },
  categoryFilterContainer: {
    width: '100%',
    maxWidth: '52.5rem',
    marginBottom: '1rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  categoryChipsWrapper: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    justifyContent: 'center',
    width: '100%',
  },
  categoryChip: ({ palette, typography }) => ({
    height: '2rem',
    borderRadius: '0.625rem',
    border: 'none',
    backgroundColor: palette.components.categoryTag.background.default,
    color: palette.text.secondary,
    ...typography.labelSmall,
    padding: '0.5rem 1rem',
    boxShadow: palette.components.categoryTag.shadow,
    transition: 'all 0.2s ease-in-out',
    '& .MuiChip-label': {
      padding: '0',
      ...typography.labelSmall,
      textTransform: 'capitalize !important',
    },
    '&.MuiChip-clickable:hover': {
      backgroundColor: palette.background.surface.interactive.selected,
      transform: 'none',
    },
  }),
  selectedCategoryChip: ({ palette, typography }) => ({
    height: '2rem',
    borderRadius: '0.625rem',
    border: 'none',
    backgroundColor: palette.components.categoryTag.background.selected,
    color: palette.components.categoryTag.text.selected,
    ...typography.labelSmall,
    padding: '0.5rem 1rem',
    boxShadow: 'none',
    transition: 'all 0.2s ease-in-out',
    '& .MuiChip-label': {
      padding: '0',
      ...typography.labelSmall,
      textTransform: 'capitalize !important',
    },
    '&.MuiChip-clickable:hover': {
      backgroundColor: palette.background.surface.interactive.selected,
      transform: 'none',
    },
  }),
  itemsContainer: ({ palette }) => ({
    width: '100%',
    borderTop: `0.0625rem solid ${palette.border.default}`,
    background: palette.background.default.primary,
    padding: '1rem 1.5rem 1rem 1.5rem',
    overflowY: 'auto',
    overflowX: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxSizing: 'border-box',
    flex: 1,
    minHeight: 0,
    gap: '1.5rem',
  }),
});

export default CategoryFilter;
