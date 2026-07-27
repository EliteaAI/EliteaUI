import { memo } from 'react';

import { Box, Chip, Typography } from '@mui/material';

const CategoryRail = memo(props => {
  const { featuredCategories = [], categories = [], selectedCategories = [], onSelectCategory } = props;

  const styles = categoryRailStyles();

  const renderChip = category => (
    <Chip
      key={category}
      label={category}
      clickable
      onClick={() => onSelectCategory?.(category)}
      sx={selectedCategories.includes(category) ? styles.selectedChip : styles.chip}
    />
  );

  return (
    <Box sx={styles.container}>
      {featuredCategories.length > 0 && (
        <Box sx={styles.section}>
          <Typography
            variant="labelSmall"
            color="text.secondary"
            sx={styles.heading}
          >
            Featured
          </Typography>
          <Box sx={styles.chips}>{featuredCategories.map(renderChip)}</Box>
        </Box>
      )}

      {categories.length > 0 && (
        <Box sx={styles.section}>
          <Typography
            variant="labelSmall"
            color="text.secondary"
            sx={styles.heading}
          >
            Categories
          </Typography>
          <Box sx={styles.chips}>{categories.map(renderChip)}</Box>
        </Box>
      )}
    </Box>
  );
});

CategoryRail.displayName = 'CategoryRail';

/** @type {MuiSx} */
const categoryRailStyles = () => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    width: '16rem',
    flexShrink: 0,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  heading: {
    textTransform: 'uppercase',
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  chip: ({ palette, typography }) => ({
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
  selectedChip: ({ palette, typography }) => ({
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
});

export default CategoryRail;
