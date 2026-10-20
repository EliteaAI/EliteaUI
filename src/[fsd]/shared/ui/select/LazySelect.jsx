import { memo, useEffect, useMemo, useState } from 'react';

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

  const loadMoreOnScroll = useMemo(
    () =>
      debounce(e => {
        const { clientHeight, scrollHeight, scrollTop } = e.target || {};
        const isNearEnd = scrollTop + clientHeight > scrollHeight - SCROLL_LOAD_MORE_THRESHOLD;
        const hasMore = total === undefined || options.length < total;
        if (isNearEnd && hasMore && !isFetching) onLoadMore?.();
      }, DEBOUNCE_DELAY_MS),
    [isFetching, onLoadMore, options.length, total],
  );

  const searchOnServer = useMemo(() => debounce(text => onSearch?.(text), DEBOUNCE_DELAY_MS), [onSearch]);

  useEffect(
    () => () => {
      loadMoreOnScroll.clear();
    },
    [loadMoreOnScroll],
  );

  useEffect(
    () => () => {
      searchOnServer.clear();
    },
    [searchOnServer],
  );

  const handleSearch = text => {
    setSearchText(text);
    searchOnServer(text);
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
      onScroll={loadMoreOnScroll}
    />
  );
});

LazySelect.displayName = 'LazySelect';

export default LazySelect;
