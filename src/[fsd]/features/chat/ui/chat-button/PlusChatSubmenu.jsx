import { memo, useCallback, useEffect, useRef } from 'react';

import { Box, MenuItem, Switch, TextField, Typography, useTheme } from '@mui/material';

import { TypographyWithConditionalTooltip } from '@/[fsd]/shared/ui/tooltip';
import { PUBLIC_PROJECT_ID } from '@/common/constants';
import { HEIGHTS, SPACING } from '@/common/designTokens';
import PlusIcon from '@/components/Icons/PlusIcon';
import SearchIcon from '@/components/Icons/SearchIcon';

const FOCUS_DELAYS = [50, 150, 300];
const SCROLL_THRESHOLD = 50;

const PlusChatSubmenu = memo(props => {
  const {
    items = [],
    searchValue = '',
    onSearchChange,
    searchPlaceholder = 'Search...',
    onCreateNew,
    createNewLabel = 'Create new',
    showCreateNew = false,
    isLoading = false,
    emptyMessage = 'No items available',
    noResultsMessage = 'No items found',
    onScroll,
    showPublicLabel = true,
    showToggle = false,
  } = props;

  const searchRef = useRef(null);
  const scrollRef = useRef(null);
  const theme = useTheme();

  useEffect(() => {
    const focusInput = () => {
      const input = searchRef.current?.querySelector('input');

      input?.focus();
    };

    const timeoutIds = FOCUS_DELAYS.map(delay => setTimeout(focusInput, delay));
    return () => timeoutIds.forEach(clearTimeout);
  }, []);

  const handleScroll = useCallback(
    event => {
      if (!onScroll) return;

      const { scrollTop, scrollHeight, clientHeight } = event.target;

      if (scrollTop + clientHeight >= scrollHeight - SCROLL_THRESHOLD && items.length > 0 && !isLoading)
        onScroll();
    },
    [onScroll, items.length, isLoading],
  );

  const handleItemClick = useCallback(item => () => item.onClick?.(), []);

  const handleToggle = useCallback(
    item => event => {
      event.stopPropagation();
      item.onToggle?.();
    },
    [],
  );

  const styles = submenuStyles(theme);

  return (
    <Box>
      <Box sx={styles.searchContainer}>
        <Box sx={styles.searchInnerContainer}>
          <SearchIcon
            style={styles.searchIcon}
            fill={theme.palette.text.secondary}
          />
          <TextField
            ref={searchRef}
            size="small"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={onSearchChange}
            sx={styles.searchField}
            variant="standard"
            autoFocus
            InputProps={{ disableUnderline: true }}
          />
        </Box>
      </Box>

      <Box
        ref={scrollRef}
        onScroll={handleScroll}
        sx={styles.scrollableContent}
      >
        {showCreateNew && (
          <MenuItem
            onClick={onCreateNew}
            sx={styles.createNewItem}
          >
            <PlusIcon
              style={styles.plusIcon}
              fill={theme.palette.icon.fill.secondary}
            />
            <Typography
              variant="bodyMedium"
              color="text.secondary"
              sx={styles.ellipsisText}
            >
              {createNewLabel}
            </Typography>
          </MenuItem>
        )}

        {showCreateNew && items.length > 0 && (
          <Box sx={styles.dividerContainer}>
            <Box sx={styles.dividerLine} />
          </Box>
        )}

        {items.map(item => {
          const isPublic = showPublicLabel && item.data?.project_id == PUBLIC_PROJECT_ID;

          return (
            <MenuItem
              key={item.key}
              onClick={showToggle ? handleToggle(item) : handleItemClick(item)}
              disabled={showToggle && item.pending}
              sx={showToggle ? styles.toggleItem : styles.listItem}
            >
              <Box sx={styles.iconContainer}>{item.icon}</Box>
              <Box
                sx={
                  isPublic
                    ? styles.labelContainerWithPublic
                    : showToggle
                      ? styles.toggleLabelContainer
                      : styles.labelContainer
                }
              >
                <TypographyWithConditionalTooltip
                  title={item.label}
                  placement="right"
                  variant="bodyMedium"
                  color="text.secondary"
                >
                  {item.label}
                </TypographyWithConditionalTooltip>
              </Box>
              {isPublic && (
                <Box sx={styles.publicLabelContainer}>
                  <Typography
                    variant="bodySmall"
                    sx={styles.publicLabel}
                  >
                    Public
                  </Typography>
                </Box>
              )}
              {showToggle && (
                <Switch
                  size="small"
                  checked={!!item.checked}
                  disabled={item.pending}
                  onChange={handleToggle(item)}
                  onClick={e => e.stopPropagation()}
                />
              )}
            </MenuItem>
          );
        })}

        {isLoading && (
          <MenuItem
            disabled
            sx={styles.listItem}
          >
            <Typography
              variant="bodyMedium"
              color="text.secondary"
            >
              Loading...
            </Typography>
          </MenuItem>
        )}

        {!isLoading && items.length === 0 && (
          <MenuItem
            disabled
            sx={styles.listItem}
          >
            <Typography
              variant="bodyMedium"
              color="text.secondary"
            >
              {searchValue ? noResultsMessage : emptyMessage}
            </Typography>
          </MenuItem>
        )}
      </Box>
    </Box>
  );
});

PlusChatSubmenu.displayName = 'PlusChatSubmenu';

const submenuStyles = theme => ({
  searchContainer: {
    padding: `${SPACING.XS} ${SPACING.LG}`,
    borderBottom: `1px solid ${theme.palette.border.lines}`,
    height: HEIGHTS.buttonLarge,
    display: 'flex',
    alignItems: 'center',
  },
  searchInnerContainer: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    gap: '0.625rem',
  },
  searchIcon: {
    width: '1.25rem',
    height: '1.25rem',
  },
  searchField: {
    width: '100%',
    '& .MuiInputBase-input': {
      padding: 0,
      color: theme.palette.text.primary,
      '&::placeholder': {
        color: theme.palette.text.disabled,
        opacity: 1,
      },
    },
  },
  scrollableContent: {
    maxHeight: '20.3125rem',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  plusIcon: {
    width: '1rem',
    height: '1rem',
  },
  createNewItem: {
    padding: `${SPACING.SM} ${SPACING.XL}`,
    height: HEIGHTS.buttonLarge,
    gap: '0.75rem',
    color: theme.palette.text.primary,
    '&:hover': {
      backgroundColor: theme.palette.background.select.hover,
    },
  },
  dividerContainer: {
    padding: '0 0 0.25rem',
    height: '0.3125rem',
  },
  dividerLine: {
    width: '100%',
    height: '1px',
    backgroundColor: theme.palette.border.lines,
  },
  ellipsisText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  iconContainer: {
    width: '1.25rem',
    height: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  labelContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '0.5rem',
    width: '10.5rem',
  },
  labelContainerWithPublic: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '0.5rem',
    width: '7rem',
    maxWidth: '7rem',
  },
  toggleLabelContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '0.5rem',
    flex: 1,
    minWidth: 0,
  },
  publicLabelContainer: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.125rem 0.375rem',
    borderRadius: '0.875rem',
    border: `1px solid ${theme.palette.border.lines}`,
  },
  publicLabel: {
    textTransform: 'none',
    color: theme.palette.text.metrics,
  },
  listItem: {
    padding: `${SPACING.SM} ${SPACING.LG}`,
    height: HEIGHTS.buttonLarge,
    gap: '0.5rem',
    color: theme.palette.text.primary,
    '&:hover': {
      backgroundColor: theme.palette.background.select.hover,
    },
  },
  toggleItem: {
    padding: `${SPACING.SM} ${SPACING.LG}`,
    height: HEIGHTS.buttonLarge,
    gap: '0.5rem',
    color: theme.palette.text.primary,
    display: 'flex',
    justifyContent: 'space-between',
    '&:hover': {
      backgroundColor: theme.palette.background.select.hover,
    },
  },
  messageContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '0.25rem',
    width: '10.5rem',
  },
});

export default PlusChatSubmenu;
