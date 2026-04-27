import { memo, useCallback, useEffect, useRef } from 'react';

import { Box, InputBase } from '@mui/material';

import SearchIcon from '@/components/Icons/SearchIcon';

const SimpleSearchBar = memo(props => {
  const {
    searchQuery = '',
    onSearchChange,
    onSearchClear,
    placeholder = 'Search...',
    autoFocus = true,
  } = props;

  const styles = simpleSearchBarStyles();
  const inputRef = useRef(null);

  const handleInputChange = useCallback(
    event => {
      onSearchChange?.(event.target.value);
    },
    [onSearchChange],
  );

  const handleKeyDown = useCallback(
    event => {
      if (event.key === 'Escape') {
        onSearchClear?.();
      }
    },
    [onSearchClear],
  );

  // Auto-focus the input when component mounts
  useEffect(() => {
    if (autoFocus) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  return (
    <Box sx={styles.searchContainer}>
      <SearchIcon fill="currentColor" />
      <InputBase
        ref={inputRef}
        autoFocus={autoFocus}
        value={searchQuery}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        sx={styles.input}
      />
    </Box>
  );
});

SimpleSearchBar.displayName = 'SimpleSearchBar';

/** @type {MuiSx} */
const simpleSearchBarStyles = () => ({
  searchContainer: ({ palette }) => ({
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: palette.background.userInputBackground,
    borderRadius: '1.6875rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    padding: '0.375rem 0.75rem',
    height: '2.25rem',
    transition: 'all 0.2s ease-in-out',
    '&:focus-within': {
      borderColor: palette.border.flowNode,
      backgroundColor: palette.background.userInputBackgroundActive,
    },
  }),
  input: ({ palette }) => ({
    flex: 1,
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    '& input': {
      padding: 0,
      color: palette.text.secondary,
      '&::placeholder': {
        color: palette.text.default,
        opacity: 1,
      },
    },
  }),
});

export default SimpleSearchBar;
