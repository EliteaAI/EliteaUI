import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { Box, Chip, ClickAwayListener, Popper, Typography, useTheme } from '@mui/material';

import { DiscoverySearchConstants } from '@/[fsd]/features/discovery-search/lib/constants';
import { Button, Input } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button';
import { MIN_SEARCH_KEYWORD_LENGTH } from '@/common/constants';
import CancelIcon from '@/components/Icons/CancelIcon';
import RemoveIcon from '@/components/Icons/RemoveIcon';
import SendIcon from '@/components/Icons/SendIcon';
import useTags from '@/hooks/useTags';
import useToast from '@/hooks/useToast';
import { actions } from '@/slices/search';

import DiscoverySearchList from './DiscoverySearchList';
import DiscoverySearchListItem from './DiscoverySearchListItem';
import DiscoverySuggestionList from './DiscoverySuggestionList';

const DiscoverySearchBar = memo(props => {
  const {
    searchString,
    setSearchString,
    searchTags,
    setSearchTags,
    onClear,
    testId = 'agent-search-input',
  } = props;
  const theme = useTheme();
  const dispatch = useDispatch();
  const { query } = useSelector(state => state.search);
  const { navigateWithTags } = useTags();
  const { toastInfo } = useToast();
  const [anchorEl, setAnchorEl] = useState(null);
  const [isSelectedMenuOpen, setIsSelectedMenuOpen] = useState(false);
  const inputRef = useRef(null);
  const panelRef = useRef(null);
  const styles = discoverySearchBarStyles();

  const searchTagLength = useMemo(() => searchTags.length, [searchTags]);
  const isEmptyInput = useMemo(() => !searchString || searchString.trim() === '', [searchString]);
  const open = useMemo(() => Boolean(anchorEl), [anchorEl]);
  const popperId = useMemo(() => (open ? 'search-bar-popper' : undefined), [open]);
  const showTopData = useMemo(
    () => open && Boolean(isEmptyInput && !searchTagLength),
    [isEmptyInput, open, searchTagLength],
  );
  const shouldShowActions = Boolean(searchString || searchTags.length);
  const hiddenTagCount = Math.max(searchTags.length - 1, 0);

  const handleFocus = useCallback(() => {
    setAnchorEl(panelRef.current);
  }, []);

  const handleClickAway = useCallback(() => {
    setAnchorEl(null);
    setIsSelectedMenuOpen(false);
    inputRef.current?.blur();
  }, []);

  const handleInputChange = useCallback(
    value => {
      setSearchString(value);
      if (value === '' && searchTagLength === 0) {
        onClear();
      }
    },
    [onClear, searchTagLength, setSearchString],
  );

  const handleClickTop = useCallback(
    searchKeyword => {
      handleInputChange(searchKeyword);
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
      if (searchString === '' && restTags.length === 0) {
        onClear();
      }
    },
    [onClear, searchString, searchTags, setSearchTags],
  );

  const handleSearch = useCallback(() => {
    handleClickAway();
    const tagNames = searchTags.map(tag => tag.name);

    if (isEmptyInput && searchTags.length > 0) {
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

  const handleKeyDown = useCallback(
    event => {
      if (event.key === 'Enter') {
        handleSearch();
      }
    },
    [handleSearch],
  );

  const toggleSelectedMenu = useCallback(() => {
    if (!panelRef.current) return;
    if (!anchorEl) setAnchorEl(panelRef.current);
    setIsSelectedMenuOpen(previous => !previous);
  }, [anchorEl]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (hiddenTagCount === 0) {
      setIsSelectedMenuOpen(false);
    }
  }, [hiddenTagCount]);

  const startAdornment = searchTags.length ? (
    <Box sx={styles.tagsContainer}>
      <Chip
        label={
          <Typography
            variant="labelSmall"
            color="text.secondary"
            noWrap
            sx={styles.selectedTagLabel}
          >
            {searchTags[0].name}
          </Typography>
        }
        deleteIcon={<RemoveIcon />}
        onDelete={handleDeleteTag(searchTags[0].id)}
        onMouseDown={event => event.stopPropagation()}
        sx={styles.selectedTagChip}
      />
      {hiddenTagCount > 0 && (
        <Button.BaseBtn
          aria-label="Show selected search tags"
          variant={BUTTON_VARIANTS.tertiary}
          onClick={toggleSelectedMenu}
          sx={styles.selectedTagsButton}
        >
          +{hiddenTagCount}
        </Button.BaseBtn>
      )}
    </Box>
  ) : null;

  const endAdornment = shouldShowActions ? (
    <Box sx={styles.actions}>
      <Button.BaseBtn
        data-testid="search-clear-button"
        aria-label="Clear search"
        variant={BUTTON_VARIANTS.tertiary}
        startIcon={
          <CancelIcon
            width="1rem"
            height="1rem"
            fill={theme.palette.icon.default}
          />
        }
        onClick={onClear}
        sx={styles.actionButton}
      />
      <Button.BaseBtn
        data-testid="search-send-button"
        aria-label="Submit search"
        variant={BUTTON_VARIANTS.tertiary}
        startIcon={<SendIcon />}
        onClick={handleSearch}
        sx={[styles.actionButton, styles.sendActionButton]}
      />
    </Box>
  ) : null;

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Box sx={styles.root}>
        <Input.SimpleSearchBar
          ref={panelRef}
          searchQuery={searchString}
          onSearchChange={handleInputChange}
          placeholder={searchTags.length ? '' : "Let's find something amazing!"}
          autoFocus={false}
          inputRef={inputRef}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          startAdornment={startAdornment}
          endAdornment={endAdornment}
          inputSx={styles.input(searchTags.length > 0, Boolean(searchString))}
          isActive={open}
          sx={styles.searchBar}
          inputProps={{ 'aria-label': 'search' }}
          data-testid={testId}
        />

        {!isSelectedMenuOpen && (
          <Popper
            id={popperId}
            open={open}
            anchorEl={anchorEl}
            placement="bottom-start"
            sx={styles.popper}
          >
            <DiscoverySuggestionList
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

        {isSelectedMenuOpen && (
          <Popper
            open={open && isSelectedMenuOpen}
            anchorEl={anchorEl}
            placement="bottom-start"
            sx={styles.popper}
          >
            <DiscoverySearchList>
              {searchTags.map(({ id, name }) => (
                <DiscoverySearchListItem
                  key={id}
                  sx={styles.selectedTagListItem}
                >
                  <Typography
                    component="span"
                    variant="bodyMedium"
                    sx={styles.selectedTagText}
                  >
                    {name}
                  </Typography>
                  <Button.BaseBtn
                    className="discovery-search-remove-icon"
                    aria-label={`Remove ${name} tag`}
                    variant={BUTTON_VARIANTS.tertiary}
                    startIcon={<RemoveIcon />}
                    onClick={handleDeleteTag(id)}
                    sx={styles.selectedTagRemoveButton}
                  />
                </DiscoverySearchListItem>
              ))}
            </DiscoverySearchList>
          </Popper>
        )}
      </Box>
    </ClickAwayListener>
  );
});

DiscoverySearchBar.displayName = 'DiscoverySearchBar';

/** @type {MuiSx} */
const discoverySearchBarStyles = () => ({
  root: {
    width: 'fit-content',
  },
  searchBar: {
    width: DiscoverySearchConstants.SEARCH_BAR_WIDTH,
  },
  // Tags and text share one horizontal scroller, so typing scrolls the tags away instead of squeezing them
  input: (hasTags, hasValue) =>
    hasTags
      ? {
          gap: '0.375rem',
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
          '& .MuiInputBase-input': {
            flex: hasValue ? '1 0 11.25rem' : '1 0 1rem',
            minWidth: 0,
            width: 'auto',
          },
        }
      : {},
  tagsContainer: {
    display: 'flex',
    flexShrink: 0,
    alignItems: 'center',
    gap: '0.375rem',
  },
  selectedTagChip: ({ palette }) => ({
    height: '1.5rem',
    maxWidth: '10rem',
    margin: '0 !important',
    flexShrink: 0,
    backgroundColor: palette.components.autocompleteChip.background.disabled,
    '& .MuiChip-label': {
      paddingLeft: '0.5rem',
      paddingRight: '0.75rem',
    },
    '& .MuiChip-deleteIcon': {
      color: palette.components.autocompleteChip.icon.default,
      fill: palette.components.autocompleteChip.icon.default,
      transform: 'translateY(0.0625rem)',
    },
    '& .MuiChip-deleteIcon path': {
      fill: palette.components.autocompleteChip.icon.default,
    },
    '&:not(.Mui-disabled) .MuiChip-deleteIcon:hover': {
      color: palette.icon.secondary,
      fill: palette.icon.secondary,
    },
    '&:not(.Mui-disabled) .MuiChip-deleteIcon:hover path': {
      fill: palette.icon.secondary,
    },
  }),
  selectedTagsButton: ({ palette }) => ({
    minWidth: 'auto !important',
    height: '1.5rem',
    margin: '0 !important',
    padding: '0.25rem 0.625rem',
    borderRadius: '1rem',
    backgroundColor: palette.components.autocompleteChip.background.disabled,
    color: palette.text.secondary,
    '&:hover': {
      backgroundColor: palette.components.styledChip.background.hover,
    },
  }),
  selectedTagLabel: {
    display: 'block',
  },
  actions: {
    display: 'flex',
    flexShrink: 0,
    alignItems: 'center',
    gap: '0.5rem',
  },
  actionButton: {
    minWidth: '1.5rem !important',
    width: '1.5rem',
    height: '1.5rem',
    padding: 0,
    '& .MuiButton-startIcon': {
      width: '1rem',
      height: '1rem',
    },
    '& .MuiButton-startIcon > svg': {
      width: '1rem',
      height: '1rem',
    },
  },
  sendActionButton: ({ palette }) => ({
    '--btn-icon-fill': palette.primary.main,
  }),
  popper: {
    width: DiscoverySearchConstants.SEARCH_BAR_WIDTH,
    zIndex: 1101,
  },
  selectedTagListItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    '&:hover .discovery-search-remove-icon': {
      opacity: 1,
    },
  },
  selectedTagText: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 'inherit',
  }),
  selectedTagRemoveButton: ({ palette }) => ({
    minWidth: '1rem !important',
    width: '1rem',
    height: '1rem',
    padding: 0,
    opacity: 0.8,
    '--btn-icon-fill': palette.icon.primary,
    '& .MuiButton-startIcon': {
      width: '1rem',
      height: '1rem',
    },
    '& .MuiButton-startIcon > svg': {
      width: '1rem',
      height: '1rem',
    },
  }),
});

export default DiscoverySearchBar;
