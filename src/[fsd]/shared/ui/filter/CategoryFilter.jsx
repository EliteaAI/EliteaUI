import { memo, useRef } from 'react';

import { Box, Chip, TextField, Typography, useTheme } from '@mui/material';

import SearchIcon from '@/components/Icons/SearchIcon';

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
    slotProps = {
      categoryList: {
        sx: {},
      },
    },
  } = props;
  const { categoryList } = slotProps || {};
  const theme = useTheme();
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

      {/* Search Bar */}
      <Box sx={styles.searchContainer(allCategories.length > 1)}>
        <Box sx={styles.searchIconContainer}>
          <SearchIcon fill={theme.palette.text.secondary} />
        </Box>
        <TextField
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={onSearchChange}
          sx={styles.searchField}
          variant="outlined"
          size="small"
        />
      </Box>

      {/* Category Filter Chips - only show when multiple categories exist */}
      {allCategories.length > 1 && (
        <Box sx={[styles.categoryFilterContainer, categoryList?.sx]}>
          <Box sx={styles.categoryChipsWrapper}>
            {allCategories.map(category => (
              <Chip
                key={category}
                label={category}
                clickable
                onClick={() => onSelectCategory(category)}
                sx={selectedCategories.includes(category) ? styles.selectedCategoryChip : styles.categoryChip}
              />
            ))}
          </Box>
        </Box>
      )}

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
    backgroundColor: palette.background.chatBkg,
  }),
  title: {
    marginBottom: '1rem',
  },
  searchContainer: showCategory => ({
    width: '23.75rem',
    marginBottom: showCategory ? '1rem' : '2rem',
    position: 'relative',
  }),
  searchIconContainer: {
    position: 'absolute',
    left: '0.75rem',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    pointerEvents: 'none',
    '& svg': {
      width: '1rem',
      height: '1rem',
    },
  },
  searchField: ({ palette, typography }) => ({
    width: '100%',
    '& .MuiOutlinedInput-root': {
      ...typography.bodyMedium,
      backgroundColor: palette.background.userInputBackground,
      border: `0.0625rem solid ${palette.border.lines}`,
      borderRadius: '1.75rem',
      height: '2.25rem',
      transition: 'border 0.3s ease, background-color 0.3s ease',
      '&:hover': {
        borderColor: palette.border.hover,
      },
      '&.Mui-focused': {
        border: `0.0625rem solid ${palette.border.flowNode}`,
        backgroundColor: palette.background.userInputBackgroundActive,
      },
      '& fieldset': {
        border: 'none',
      },
      '&:hover fieldset': {
        border: 'none',
      },
      '&.Mui-focused fieldset': {
        border: 'none',
      },
    },
    '& .MuiInputBase-input': {
      padding: '0.375rem 0.75rem',
      paddingLeft: '2.5rem',
      ...typography.bodyMedium,
      color: palette.text.secondary,
      '&::placeholder': {
        color: palette.text.disabled,
        opacity: 1,
      },
    },
  }),
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
    backgroundColor: palette.background.tag.default,
    color: palette.text.secondary,
    ...typography.labelSmall,
    padding: '0.5rem 1rem',
    boxShadow: palette.boxShadow.tag,
    transition: 'all 0.2s ease-in-out',
    '& .MuiChip-label': {
      padding: '0',
      ...typography.labelSmall,
      textTransform: 'capitalize !important',
    },
    '&.MuiChip-clickable:hover': {
      backgroundColor: palette.background.button.secondary.hover,
      transform: 'none',
    },
  }),
  selectedCategoryChip: ({ palette, typography }) => ({
    height: '2rem',
    borderRadius: '0.625rem',
    border: 'none',
    backgroundColor: palette.background.tag.selected,
    color: palette.text.tag.selected,
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
      backgroundColor: palette.background.button.secondary.hover,
      transform: 'none',
    },
  }),
  itemsContainer: ({ palette }) => ({
    width: '100%',
    borderTop: `0.0625rem solid ${palette.border.table}`,
    background: palette.background.eliteaDefault,
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
