import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { Category } from '@/[fsd]/shared/ui';

const CategorySection = memo(props => {
  const { category, items, EmptyPlaceholder, showCategory = true } = props;
  const styles = getStyles();

  return (
    <Box
      key={category}
      sx={styles.categorySection(showCategory)}
    >
      {showCategory && (
        <Typography
          variant="subtitle"
          sx={styles.categoryTitle}
        >
          {category}
        </Typography>
      )}
      {showCategory && <Box sx={styles.categoryDivider} />}
      <Box sx={styles.itemsGrid}>
        {items.map(item => (
          <Category.CategoryItemCard
            key={item.key}
            itemKey={item.key}
            label={item.label}
            icon={item.icon}
            onClick={item.onClick}
          />
        ))}
        {items.length === 0 ? (EmptyPlaceholder ?? null) : null}
      </Box>
    </Box>
  );
});

CategorySection.displayName = 'CategorySection';

/** @type {MuiSx} */
const getStyles = () => ({
  categorySection: showCategory => ({
    marginBottom: '2rem',
    width: '100%',
    maxWidth: '52.5rem',
    marginTop: showCategory ? 0 : '1rem',
  }),
  categoryTitle: ({ palette }) => ({
    color: palette.text.groupedTitle.default,
  }),
  categoryDivider: ({ palette }) => ({
    width: '100%',
    height: '0.0625rem',
    backgroundColor: palette.border.table,
    marginBottom: '0.625rem',
    marginTop: '0.3125rem',
  }),
  itemsGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
});

export default CategorySection;
