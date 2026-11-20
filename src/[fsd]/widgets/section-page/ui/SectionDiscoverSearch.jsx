import { memo, useCallback } from 'react';

import { Box } from '@mui/material';

import { Input } from '@/[fsd]/shared/ui';

const SEARCH_WIDTH = '19.5rem';

// The catalog's own search, as on the Catalog page
const SectionDiscoverSearch = memo(props => {
  const { query, onQueryChange, placeholder, filterButton } = props;
  const onClear = useCallback(() => onQueryChange(''), [onQueryChange]);
  const styles = sectionDiscoverSearchStyles();

  return (
    <Box sx={styles.root}>
      <Input.SimpleSearchBar
        searchQuery={query}
        onSearchChange={onQueryChange}
        onSearchClear={onClear}
        placeholder={placeholder}
        autoFocus={false}
        endAdornment={filterButton}
        data-testid="catalog-search-input"
      />
    </Box>
  );
});

SectionDiscoverSearch.displayName = 'SectionDiscoverSearch';

/** @type {MuiSx} */
const sectionDiscoverSearchStyles = () => ({
  root: {
    width: SEARCH_WIDTH,
    flexShrink: 0,
  },
});

export default SectionDiscoverSearch;
