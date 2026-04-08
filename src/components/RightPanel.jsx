import { useCallback, useEffect, useRef, useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { Box, Grid } from '@mui/material';

import {
  NAV_BAR_HEIGHT_TABLET,
  PAGE_PADDING,
  RIGHT_PANEL_HEIGHT_OFFSET,
  RIGHT_PANEL_WIDTH_OF_CARD_LIST_PAGE,
} from '@/common/constants';
import { filterProps } from '@/common/utils';
import useSearchBar from '@/hooks/useSearchBar';
import useTags from '@/hooks/useTags';
import { actions } from '@/slices/search';

import SearchBar from './SearchBar';

export const FixedGrid = styled(
  Grid,
  filterProps('offsetFromTop'),
)(({ offsetFromTop, theme }) => ({
  position: 'fixed',
  right: `${PAGE_PADDING}px`,
  width: `${RIGHT_PANEL_WIDTH_OF_CARD_LIST_PAGE}px`,
  paddingLeft: '1rem',
  top: offsetFromTop,
  [theme.breakpoints.down('tablet')]: {
    top: NAV_BAR_HEIGHT_TABLET,
  },
  zIndex: 1000,
}));

const ContainerBox = styled(
  Box,
  filterProps('offsetFromTop'),
)(() => ({
  maxHeight: `calc(100vh - 32px)`,
  width: `${RIGHT_PANEL_WIDTH_OF_CARD_LIST_PAGE}px`,
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
}));

export default function RightPanel({ children, offsetFromTop = RIGHT_PANEL_HEIGHT_OFFSET }) {
  const dispatch = useDispatch();
  const { showSearchBar } = useSearchBar();
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
  const onClearRef = useRef(onClear);

  useEffect(() => {
    onClearRef.current = onClear;
  }, [onClear]);

  return (
    <FixedGrid
      size={{ xs: 3 }}
      offsetFromTop={offsetFromTop}
    >
      <ContainerBox offsetFromTop={offsetFromTop}>
        {showSearchBar && (
          <SearchBar
            searchString={searchString}
            setSearchString={setSearchString}
            searchTags={searchTags}
            setSearchTags={setSearchTags}
            onClear={onClear}
          />
        )}
        {children}
      </ContainerBox>
    </FixedGrid>
  );
}
