import { memo } from 'react';

import { DiscoverySearchBar, useDiscoverySearchState } from '@/[fsd]/features/discovery-search';

// The project list's search: today's search with tag suggestions, moved from the right panel into the toolbar
const SectionProjectSearch = memo(props => {
  const { placeholder, testId, filterButton } = props;
  const { searchString, setSearchString, searchTags, setSearchTags, onClear } = useDiscoverySearchState();

  return (
    <DiscoverySearchBar
      searchString={searchString}
      setSearchString={setSearchString}
      searchTags={searchTags}
      setSearchTags={setSearchTags}
      onClear={onClear}
      placeholder={placeholder}
      testId={testId}
      extraEndAdornment={filterButton}
    />
  );
});

SectionProjectSearch.displayName = 'SectionProjectSearch';

export default SectionProjectSearch;
