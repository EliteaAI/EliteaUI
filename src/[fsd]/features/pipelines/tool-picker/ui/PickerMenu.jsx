import { Fragment, memo, useCallback } from 'react';

import { Box, CircularProgress, MenuItem, Popover, Typography } from '@mui/material';

import { customScrollbarSx } from '@/[fsd]/shared/lib/helpers';
import { Button, Input } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import PlusIcon from '@/assets/plus-icon.svg?react';

// Distance from the list bottom that loads the next page
const LOAD_MORE_THRESHOLD = 48;

/**
 * Searchable, scroll-loading menu of a picker: search, "Create new" actions, grouped items,
 * loading, empty and error states.
 */
const PickerMenu = memo(props => {
  const {
    anchorEl,
    open,
    onClose,
    searchValue,
    onSearchChange,
    searchPlaceholder = 'Search...',
    createActions = [],
    groups = [],
    renderItem,
    isLoading = false,
    isError = false,
    onRetry,
    onLoadMore,
    emptyMessage = 'Nothing here yet',
    noResultsMessage = 'Nothing found',
    'data-testid': testId,
  } = props;

  const handleScroll = useCallback(
    event => {
      if (isLoading || isError) return;
      const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
      if (scrollTop + clientHeight >= scrollHeight - LOAD_MORE_THRESHOLD) onLoadMore?.();
    },
    [isError, isLoading, onLoadMore],
  );

  const handleSearchClear = useCallback(() => onSearchChange?.(''), [onSearchChange]);

  const itemsCount = groups.reduce((count, group) => count + group.items.length, 0);
  const showGroupTitles = groups.filter(group => group.items.length).length > 1;
  const styles = pickerMenuStyles(anchorEl?.clientWidth);

  return (
    <Popover
      className="nokey"
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      slotProps={{ paper: { sx: styles.paper, 'data-testid': testId } }}
    >
      <Input.SimpleSearchBar
        searchQuery={searchValue}
        onSearchChange={onSearchChange}
        onSearchClear={handleSearchClear}
        placeholder={searchPlaceholder}
        sx={styles.search}
        data-testid={testId ? `${testId}-search` : undefined}
      />
      {createActions.map(action => (
        <MenuItem
          key={action.key}
          onClick={action.onClick}
          sx={styles.createAction}
          data-testid={action.testId}
        >
          <PlusIcon style={styles.plusIcon} />
          <Typography
            variant="bodyMedium"
            color="text.secondary"
          >
            {action.label}
          </Typography>
        </MenuItem>
      ))}
      <Box
        role="listbox"
        sx={styles.list}
        onScroll={handleScroll}
      >
        {isError ? (
          <Box
            sx={styles.message}
            data-testid={testId ? `${testId}-error` : undefined}
          >
            <Typography
              variant="bodySmall"
              color="text.primary"
            >
              Could not load the list.
            </Typography>
            <Button.BaseBtn
              variant={BUTTON_VARIANTS.tertiary}
              onClick={onRetry}
              data-testid={testId ? `${testId}-retry` : undefined}
            >
              Retry
            </Button.BaseBtn>
          </Box>
        ) : (
          groups.map(group => (
            <Fragment key={group.key}>
              {showGroupTitles && group.items.length > 0 && (
                <Typography
                  variant="labelSmall"
                  sx={styles.groupTitle}
                >
                  {group.title}
                </Typography>
              )}
              {group.items.map(renderItem)}
            </Fragment>
          ))
        )}
        {isLoading && !isError && (
          <Box sx={styles.message}>
            <CircularProgress size="1.25rem" />
          </Box>
        )}
        {!isLoading && !isError && itemsCount === 0 && (
          <Box
            sx={styles.message}
            data-testid={testId ? `${testId}-empty` : undefined}
          >
            <Typography
              variant="bodySmall"
              color="text.primary"
            >
              {searchValue ? noResultsMessage : emptyMessage}
            </Typography>
          </Box>
        )}
      </Box>
    </Popover>
  );
});

PickerMenu.displayName = 'PickerMenu';

/** @type {MuiSx} */
const pickerMenuStyles = anchorWidth => ({
  paper: ({ palette }) => ({
    width: anchorWidth ? `max(${anchorWidth / 16}rem, 20rem)` : '20rem',
    maxHeight: '26rem',
    marginTop: '0.25rem',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    backgroundColor: palette.background.default.secondary,
  }),
  // Flat, full-width search, as in the select dropdowns
  search: ({ palette }) => ({
    flexShrink: 0,
    borderRadius: 0,
    border: 'none',
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
    backgroundColor: 'transparent',
    padding: '0.75rem 1rem',
    height: 'auto',
    '&:hover': {
      borderColor: palette.border.lines,
    },
    '&:focus-within': {
      backgroundColor: 'transparent',
      borderColor: palette.border.lines,
    },
  }),
  createAction: ({ palette }) => ({
    gap: '0.75rem',
    padding: '0.5rem 1rem',
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
  }),
  plusIcon: {
    width: '1rem',
    height: '1rem',
  },
  list: [
    {
      flex: 1,
      minHeight: 0,
      overflowY: 'auto',
      padding: '0.25rem 0',
    },
    customScrollbarSx,
  ],
  groupTitle: ({ palette }) => ({
    display: 'block',
    padding: '0.5rem 1rem 0.25rem',
    color: palette.text.metrics,
    textTransform: 'uppercase',
  }),
  message: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '1rem',
    textAlign: 'center',
  },
});

export default PickerMenu;
