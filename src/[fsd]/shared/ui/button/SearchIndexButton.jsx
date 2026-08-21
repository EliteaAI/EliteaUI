import { memo, useCallback } from 'react';

import RocketIcon from '@/assets/rocket-icon.svg?react';

import IconLabelButton from './IconLabelButton';

const SearchIndexButton = memo(props => {
  const { onSearch, disabled = false, tooltip = 'Search this index', testId = 'index-search-button' } = props;

  const handleSearch = useCallback(
    event => {
      onSearch?.(event);
    },
    [onSearch],
  );

  return (
    <IconLabelButton
      label="Search"
      icon={<RocketIcon />}
      tooltip={tooltip}
      ariaLabel="search index"
      testId={testId}
      disabled={disabled}
      onClick={handleSearch}
    />
  );
});

SearchIndexButton.displayName = 'SearchIndexButton';

export default SearchIndexButton;
