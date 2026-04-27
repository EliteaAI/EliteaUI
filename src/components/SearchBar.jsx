import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { Box, ClickAwayListener, Popper, Typography, useTheme } from '@mui/material';

import { MIN_SEARCH_KEYWORD_LENGTH } from '@/common/constants';
import useTags from '@/hooks/useTags';
import useToast from '@/hooks/useToast';
import { actions } from '@/slices/search';

import {
  SearchPanel,
  StyledCancelIcon,
  StyledInputBase,
  StyledList,
  StyledListItem,
  StyledRemoveIcon,
  StyledSearchIcon,
  StyledSendIcon,
} from './SearchBarComponents';
import SuggestionList from './SuggestionList';

export default function SearchBar({ searchString, setSearchString, searchTags, setSearchTags, onClear }) {
  const theme = useTheme();
  const { query } = useSelector(state => state.search);
  const disableSearchButton = useMemo(() => !searchString || query === searchString, [query, searchString]);

  // input props
  const searchTagLength = useMemo(() => searchTags.length, [searchTags]);
  const isEmptyInput = useMemo(() => !searchString || searchString.trim() === '', [searchString]);
  // showSearchButton computed previously but unused; keep display logic inline to avoid linter warnings

  // dropdown related
  const [anchorEl, setAnchorEl] = useState(null);
  const inputRef = useRef(null);
  const panelRef = useRef(null);
  const open = useMemo(() => Boolean(anchorEl), [anchorEl]);
  const popperId = useMemo(() => (open ? 'search-bar-popper' : undefined), [open]);
  const showTopData = useMemo(
    () => open && Boolean(isEmptyInput && !searchTagLength),
    [isEmptyInput, open, searchTagLength],
  );
  // selected items menu state
  const [isSelectedMenuOpen, setIsSelectedMenuOpen] = useState(false);

  const truncate = useCallback((text, max = 10) => {
    if (!text) return '';
    return text.length > max ? text.slice(0, max) + '…' : text;
  }, []);

  const handleFocus = useCallback(() => {
    if (panelRef) {
      setAnchorEl(panelRef.current);
    }
  }, []);

  const handleClickAway = useCallback(() => {
    setAnchorEl(null);
    setIsSelectedMenuOpen(false);
    if (inputRef.current) {
      inputRef.current.blur();
    }
  }, []);

  // auto suggest list items interactions
  const handleInputChange = useCallback(
    event => {
      const newInputValue = event.target.value;
      setSearchString(newInputValue);
      if (newInputValue === '' && searchTagLength === 0) {
        onClear();
      }
    },
    [onClear, searchTagLength, setSearchString],
  );

  const handleClickTop = useCallback(
    search_keyword => {
      handleInputChange({ target: { value: search_keyword } });
    },
    [handleInputChange],
  );

  const handleAddTag = useCallback(
    tag => {
      if (!searchTags.some(item => item.id === tag.id)) {
        setSearchTags([...searchTags, tag]);
        if (searchString !== query) {
          setSearchString('');
        }
      }
    },
    [query, searchString, searchTags, setSearchString, setSearchTags],
  );

  const handleDeleteTag = useCallback(
    tagIdToDelete => () => {
      const restTags = searchTags.filter(({ id }) => id !== tagIdToDelete);
      setSearchTags(restTags);
      if (restTags.length === 0) {
        setIsSelectedMenuOpen(false);
      }
      if (searchString === '' && restTags.length === 0) {
        onClear();
      }
    },
    [onClear, searchString, searchTags, setSearchTags],
  );

  // search logics
  const { navigateWithTags } = useTags();
  const dispatch = useDispatch();
  const { toastInfo } = useToast();
  const onSearch = useCallback(() => {
    handleClickAway();
    const tagNames = searchTags?.map(t => t.name);
    if (isEmptyInput && searchTags?.length > 0) {
      dispatch(actions.setQuery({ query: '', queryTags: searchTags }));
      navigateWithTags(tagNames);
      setSearchTags([]);
      return;
    }

    const trimmedSearchString = searchString.trim();
    setSearchString(trimmedSearchString);
    if (trimmedSearchString.length >= MIN_SEARCH_KEYWORD_LENGTH) {
      dispatch(actions.setQuery({ query: trimmedSearchString, queryTags: searchTags }));
      navigateWithTags(tagNames);
      setSearchTags([]);
    } else {
      toastInfo('The search key word should be at least 3 letters long');
    }
  }, [
    dispatch,
    handleClickAway,
    isEmptyInput,
    navigateWithTags,
    searchString,
    searchTags,
    setSearchString,
    setSearchTags,
    toastInfo,
  ]);

  const onKeyDown = useCallback(
    event => {
      if (event.key === 'Enter') {
        onSearch();
      }
    },
    [onSearch],
  );

  const toggleSelectedMenu = useCallback(() => {
    if (!panelRef.current) return;
    if (!anchorEl) setAnchorEl(panelRef.current);
    setIsSelectedMenuOpen(prev => !prev);
  }, [anchorEl]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <ClickAwayListener onClickAway={handleClickAway}>
        <SearchPanel ref={panelRef}>
          <StyledSearchIcon />

          {/* Scrollable tags container */}
          <Box
            sx={{
              display: 'flex',
              overflowX: 'auto',
              overflowY: 'hidden',
              width: searchString || searchTags?.length ? 'calc(100% - 78px)' : '100%', // Reserve space for icons
              scrollbarWidth: 'none', // Firefox
              '&::-webkit-scrollbar': { display: 'none' }, // Webkit browsers
              '&::-webkit-scrollbar-track': { display: 'none' },
            }}
          >
            {/* One visible chip + "+N" compact chip */}
            {searchTags.length > 0 && (
              <Box
                key={searchTags[0].id}
                sx={{
                  display: 'flex',
                  padding: '4px 6px 4px 10px',
                  gap: '4px',
                  flexShrink: 0,
                }}
              >
                <Typography
                  variant="bodySmall"
                  component="span"
                  sx={{ whiteSpace: 'nowrap', color: theme.palette.text.secondary }}
                >
                  {truncate(searchTags[0].name)}
                </Typography>
                <StyledRemoveIcon onClick={handleDeleteTag(searchTags[0].id)} />
              </Box>
            )}
            {searchTags.length > 1 && (
              <Box
                onClick={toggleSelectedMenu}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px 10px',
                  marginLeft: '6px',
                  borderRadius: '16px',
                  backgroundColor:
                    theme.palette.background.tagChip?.default || theme.palette.background.button.default,
                  color: theme.palette.text.tagChip?.default || theme.palette.text.secondary,
                  cursor: 'pointer',
                  userSelect: 'none',
                  flexShrink: 0,
                  transition: 'background-color 0.2s ease',
                  '&:hover': {
                    backgroundColor:
                      theme.palette.background.tagChip?.hover || theme.palette.background.select.hover,
                  },
                }}
              >
                <Typography
                  variant="bodySmall"
                  component="span"
                >
                  +{searchTags.length - 1}
                </Typography>
              </Box>
            )}
            <StyledInputBase
              placeholder="Let's find something amazing!"
              inputProps={{ 'aria-label': 'search' }}
              inputRef={inputRef}
              onChange={handleInputChange}
              onFocus={handleFocus}
              onKeyDown={onKeyDown}
              value={searchString}
              sx={{
                minWidth: '180px', // Allow input to grow
                flexShrink: 0, // Allow input to shrink
              }}
            />
          </Box>
          <Box
            display={searchString || searchTags?.length ? 'flex' : 'none'}
            alignItems={'center'}
            gap={'0px'}
            sx={{ flexShrink: 0 }}
            height={'100%'}
            position={'absolute'}
            right={'12px'}
            top={'0px'}
          >
            <StyledCancelIcon onClick={onClear} />
            <StyledSendIcon
              disabled={disableSearchButton}
              onClick={onSearch}
            />
          </Box>
          {/* Suggestions Popper (hidden when selected-items menu is open) */}
          {!isSelectedMenuOpen && (
            <Popper
              id={popperId}
              open={open}
              anchorEl={anchorEl}
              placement="bottom-start"
              style={{ width: panelRef.current?.clientWidth, zIndex: '1101' }}
            >
              <SuggestionList
                searchString={searchString}
                isEmptyInput={isEmptyInput}
                searchTags={searchTags}
                searchTagLength={searchTagLength}
                showTopData={showTopData}
                handleClickTop={handleClickTop}
                handleAddTag={handleAddTag}
              />
            </Popper>
          )}

          {/* Selected items Popper */}
          {isSelectedMenuOpen && (
            <Popper
              open={open && isSelectedMenuOpen}
              anchorEl={anchorEl}
              placement="bottom-start"
              style={{ width: panelRef.current?.clientWidth, zIndex: '1101' }}
            >
              <StyledList>
                {searchTags.map(({ id, name }) => (
                  <StyledListItem
                    key={id}
                    disableGutters
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      '&:hover .alita-remove-icon': { opacity: 1 },
                    }}
                  >
                    <Typography
                      variant="bodyMedium"
                      component="span"
                      sx={{ color: theme.palette.text.primary }}
                    >
                      {name}
                    </Typography>
                    <Box
                      className="alita-remove-icon"
                      sx={{ opacity: 0.8 }}
                    >
                      <StyledRemoveIcon onClick={handleDeleteTag(id)} />
                    </Box>
                  </StyledListItem>
                ))}
                {searchTags.length === 0 && <StyledListItem disabled>No selected items</StyledListItem>}
              </StyledList>
            </Popper>
          )}
        </SearchPanel>
      </ClickAwayListener>
    </>
  );
}
