import { forwardRef, memo, useCallback, useEffect, useRef } from 'react';

import { Box, InputBase } from '@mui/material';

import SearchIcon from '@/assets/search-icon.svg?react';

const SimpleSearchBar = memo(
  forwardRef((props, ref) => {
    const {
      searchQuery = '',
      onSearchChange,
      onSearchClear,
      placeholder = 'Search...',
      autoFocus = true,
      isActive = false,
      sx,
      inputSx,
      inputRef: externalInputRef,
      inputProps,
      startAdornment,
      endAdornment,
      onFocus: externalOnFocus,
      onKeyDown: externalOnKeyDown,
      'data-testid': testId,
    } = props;

    const styles = simpleSearchBarStyles();
    const inputRef = useRef(null);

    const setInputRef = useCallback(
      node => {
        inputRef.current = node;

        if (typeof externalInputRef === 'function') {
          externalInputRef(node);
        } else if (externalInputRef) {
          externalInputRef.current = node;
        }
      },
      [externalInputRef],
    );

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
        externalOnKeyDown?.(event);
      },
      [onSearchClear, externalOnKeyDown],
    );

    useEffect(() => {
      if (autoFocus) {
        const timer = setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
        return () => clearTimeout(timer);
      }
    }, [autoFocus]);

    const resolvedInputProps = {
      ...inputProps,
      ...(testId ? { 'data-testid': testId } : {}),
    };

    return (
      <Box
        ref={ref}
        sx={[styles.searchContainer(isActive), sx]}
      >
        <SearchIcon
          width="1rem"
          height="1rem"
        />
        <InputBase
          autoFocus={autoFocus}
          startAdornment={startAdornment}
          value={searchQuery}
          inputRef={setInputRef}
          onChange={handleInputChange}
          onFocus={externalOnFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          sx={[styles.input, inputSx]}
          inputProps={Object.keys(resolvedInputProps).length ? resolvedInputProps : undefined}
        />
        {endAdornment}
      </Box>
    );
  }),
);

SimpleSearchBar.displayName = 'SimpleSearchBar';

/** @type {MuiSx} */
const simpleSearchBarStyles = () => ({
  searchContainer:
    isActive =>
    ({ palette }) => ({
      width: '100%',
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      backgroundColor: isActive
        ? palette.background.surface.interactive.active
        : palette.background.surface.interactive.default,
      borderRadius: '1.6875rem',
      border: `0.0625rem solid ${isActive ? palette.border.inputHover : palette.border.lines}`,
      padding: '0.375rem 0.75rem',
      height: '2.25rem',
      transition: 'border-color 0.2s ease-in-out, background-color 0.2s ease-in-out',
      '& > svg': {
        flexShrink: 0,
        color: palette.icon.default,
      },
      '&:hover': {
        borderColor: palette.border.inputHover,
      },
      '&:focus-within': {
        borderColor: palette.border.inputHover,
        backgroundColor: palette.background.surface.interactive.active,
      },
    }),
  input: ({ palette }) => ({
    flex: 1,
    minWidth: 0,
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    fontWeight: palette.mode === 'light' ? 500 : 400,
    color: palette.text.secondary,
    '& input': {
      padding: 0,
      color: 'inherit',
      fontWeight: 'inherit',
      '&::placeholder': {
        color: palette.text.muted,
        opacity: 1,
      },
    },
  }),
});

export default SimpleSearchBar;
