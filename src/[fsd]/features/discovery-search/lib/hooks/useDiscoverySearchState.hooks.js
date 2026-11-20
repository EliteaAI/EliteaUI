import { useCallback, useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { useTags } from '@/[fsd]/shared/lib/hooks';
import { actions } from '@/slices/search';

export const useDiscoverySearchState = () => {
  const dispatch = useDispatch();
  const { query, queryTags } = useSelector(state => state.search);
  const [searchString, setSearchString] = useState(query);
  const [searchTags, setSearchTags] = useState(queryTags);
  const { navigateWithTags, selectedTags: urlTags } = useTags();

  const onClear = useCallback(() => {
    setSearchString('');
    setSearchTags([]);
    dispatch(actions.resetQuery());
    if (urlTags) {
      navigateWithTags([]);
    }
  }, [dispatch, navigateWithTags, urlTags]);

  return { searchString, setSearchString, searchTags, setSearchTags, onClear };
};
