import { memo, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { Category } from '@/[fsd]/shared/ui';

const UNGROUPED = 'Other';

const buildSubGroups = items => {
  const groupOf = item => item.group || UNGROUPED;
  const distinct = [...new Set(items.map(groupOf))];
  if (distinct.length < 2) return null;

  distinct.sort((a, b) => {
    if (a === UNGROUPED) return 1;
    if (b === UNGROUPED) return -1;
    return a.localeCompare(b, undefined, { sensitivity: 'base' });
  });
  return distinct.map(group => ({ group, items: items.filter(item => groupOf(item) === group) }));
};

const CategorySection = memo(props => {
  const { category, items, EmptyPlaceholder, showCategory = true, enableSubGroups = false } = props;
  const styles = getStyles();
  const subGroups = useMemo(() => (enableSubGroups ? buildSubGroups(items) : null), [enableSubGroups, items]);

  const renderCard = item => (
    <Category.CategoryItemCard
      key={item.key}
      itemKey={item.key}
      label={item.label}
      icon={item.icon}
      onClick={item.onClick}
    />
  );

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
      {subGroups ? (
        subGroups.map(({ group, items: groupItems }) => (
          <Box key={group}>
            <Typography
              variant="bodySmall"
              sx={styles.subGroupTitle}
            >
              {group}
            </Typography>
            <Box sx={styles.itemsGrid}>{groupItems.map(renderCard)}</Box>
          </Box>
        ))
      ) : (
        <Box sx={styles.itemsGrid}>
          {items.map(renderCard)}
          {items.length === 0 ? (EmptyPlaceholder ?? null) : null}
        </Box>
      )}
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
  subGroupTitle: ({ palette }) => ({
    display: 'block',
    color: palette.text.secondary,
    marginBottom: '0.375rem',
    marginTop: '0.75rem',
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
