import { memo, useEffect, useMemo, useRef, useState } from 'react';

import { debounce } from '@mui/material';

import SingleSelect from './SingleSelect';

const SCROLL_LOAD_MORE_THRESHOLD = 10;
const DEBOUNCE_DELAY_MS = 300;

const LazySelect = memo(props => {
  const {
    options,
    total,
    isFetching,
    onLoadMore,
    searchString = '',
    onSearch,
    emptyPlaceholder,
    ...singleSelectProps
  } = props;
  const [searchText, setSearchText] = useState(searchString);
  const [syncedSearchString, setSyncedSearchString] = useState(searchString);
  if (searchString !== syncedSearchString) {
    setSyncedSearchString(searchString);
    setSearchText(searchString);
  }

  // The delayed calls read the latest props, so a re-render never drops a pending call
  const latest = useRef();
  useEffect(() => {
    latest.current = { isFetching, loaded: options.length, onLoadMore, onSearch, total };
  });

  const loadMoreAfterDelay = useMemo(
    () =>
      debounce(isNearEnd => {
        const { isFetching: fetching, loaded, onLoadMore: loadMore, total: count } = latest.current;
        if (isNearEnd && !fetching && (count === undefined || loaded < count)) loadMore?.();
      }, DEBOUNCE_DELAY_MS),
    [],
  );

  const searchAfterDelay = useMemo(
    () => debounce(text => latest.current.onSearch?.(text), DEBOUNCE_DELAY_MS),
    [],
  );

  useEffect(
    () => () => {
      loadMoreAfterDelay.clear();
      searchAfterDelay.clear();
    },
    [loadMoreAfterDelay, searchAfterDelay],
  );

  const handleScroll = e => {
    const { clientHeight, scrollHeight, scrollTop } = e.target;
    loadMoreAfterDelay(scrollTop + clientHeight > scrollHeight - SCROLL_LOAD_MORE_THRESHOLD);
  };

  const handleSearch = text => {
    setSearchText(text);
    if (text) {
      searchAfterDelay(text);
      return;
    }
    searchAfterDelay.clear();
    onSearch?.('');
  };

  return (
    <SingleSelect
      withSearch
      {...singleSelectProps}
      options={options}
      searchFilterMode="remote"
      searchString={searchText}
      onSearch={handleSearch}
      isListFetching={isFetching}
      emptyPlaceholder={isFetching && !options.length ? '' : emptyPlaceholder}
      onScroll={handleScroll}
    />
  );
});

LazySelect.displayName = 'LazySelect';

export default LazySelect;
