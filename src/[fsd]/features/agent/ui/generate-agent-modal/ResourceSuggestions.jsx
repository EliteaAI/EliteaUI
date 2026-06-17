import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import SuggestionItem from './SuggestionItem';

const ResourceSuggestions = memo(props => {
  const { title, items, selectedIds, onToggle, entityType } = props;

  if (!items?.length) return null;

  return (
    <Box sx={styles.container}>
      <Typography sx={styles.title}>{title}</Typography>
      <Box sx={styles.list}>
        {items.map(item => (
          <SuggestionItem
            key={item.id}
            item={item}
            checked={selectedIds.has(item.id)}
            onToggle={onToggle}
            entityType={entityType}
          />
        ))}
      </Box>
    </Box>
  );
});

ResourceSuggestions.displayName = 'ResourceSuggestions';

/** @type {MuiSx} */
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    paddingTop: '0.5rem',
  },
  title: {
    fontSize: '0.75rem',
    fontWeight: 500,
    lineHeight: '1rem',
    letterSpacing: '0.045rem',
    textTransform: 'uppercase',
    color: 'text.primary',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
};

export default ResourceSuggestions;
