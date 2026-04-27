import { memo, useCallback, useEffect, useRef } from 'react';

import {
  Box,
  ClickAwayListener,
  Grow,
  MenuItem,
  Paper,
  Popper,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';

import { TypographyWithConditionalTooltip } from '@/[fsd]/shared/ui/tooltip';
import { PUBLIC_PROJECT_ID } from '@/common/constants';
import { HEIGHTS, ICON_SIZES, SPACING } from '@/common/designTokens';
import PlusIcon from '@/components/Icons/PlusIcon';
import SearchIcon from '@/components/Icons/SearchIcon';

// Unified dropdown constants matching Figma specifications
export const DROPDOWN_CONSTANTS = {
  TIMEOUTS: {
    FOCUS_RETRY_1: 50,
    FOCUS_RETRY_2: 150,
    FOCUS_RETRY_3: 300,
  },
  DIMENSIONS: {
    MENU_WIDTH: '14.25rem', // 228px - Exact Figma width
    MENU_MAX_HEIGHT: '23.3125rem', // 373px - Set maxHeight instead of fixed height
    ITEM_HEIGHT: HEIGHTS.buttonLarge, // 40px
    SEARCH_FIELD_HEIGHT: '2rem', // 32px - Figma height
    ICON_SIZE: ICON_SIZES.SM, // 16px
  },
  SPACING: {
    MENU_PADDING: '0.25rem 0', // 4px 0px - Figma padding
    MENU_TOP_MARGIN: SPACING.SM, // 8px
    ITEM_ICON_TEXT_GAP: SPACING.gap.MD, // 12px (Figma gap between icon and text)
    ITEM_REGULAR_GAP: SPACING.gap.SM, // 8px (Figma gap for regular items)
  },
  BORDER_RADIUS: {
    MENU: SPACING.SM, // 8px
  },
};

/**
 * UnifiedDropdown - A reusable dropdown component for both ToolMenu and Participants
 *
 * @param {Object} props
 * @param {Element} props.anchorEl - The anchor element for the dropdown
 * @param {boolean} props.open - Whether the dropdown is open
 * @param {function} props.onClose - Function to call when closing the dropdown
 * @param {Array} props.items - Array of items to display in the dropdown
 * @param {string} props.searchValue - Current search value
 * @param {function} props.onSearchChange - Function to call when search value changes
 * @param {string} props.searchPlaceholder - Placeholder text for search input
 * @param {function} props.onCreateNew - Function to call when "Create new" is clicked
 * @param {string} props.createNewLabel - Label for the "Create new" option
 * @param {boolean} props.showCreateNew - Whether to show the "Create new" option
 * @param {boolean} props.isLoading - Whether data is loading
 * @param {string} props.emptyMessage - Message to show when no items available
 * @param {string} props.noResultsMessage - Message to show when search has no results
 * @param {boolean} props.autoFocus - Whether to auto-focus the search input
 * @param {function} props.onScroll - Function to call when scrolling (for load more)
 * @param {boolean} props.showDivider - Whether to show divider after "Create new"
 */
const UnifiedDropdown = memo(
  ({
    anchorEl,
    open,
    onClose,
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
    autoFocus = false,
    onScroll,
    showDivider = true,
    // When true, the dropdown opens to the left of the anchor (for collapsed rail)
    preferLeft = false,
    sx = {},
    showPublicLabel = false,
  }) => {
    const theme = useTheme();
    const searchRef = useRef(null);
    const scrollRef = useRef(null);

    // Auto-focus search input when dropdown opens
    useEffect(() => {
      if (open && autoFocus) {
        const focusInput = () => {
          if (searchRef.current) {
            // Try direct focus on the ref
            searchRef.current.focus?.();

            // Try querySelector for input element
            const inputElement = searchRef.current.querySelector('input');
            if (inputElement) {
              inputElement.focus();
              return;
            }

            // Try querySelector for textarea (in case it's multiline)
            const textareaElement = searchRef.current.querySelector('textarea');
            if (textareaElement) {
              textareaElement.focus();
              return;
            }
          }
        };

        // Array to store timeout IDs
        const timeoutIds = [];

        // Try multiple times with increasing delays to ensure the menu is fully rendered
        timeoutIds.push(setTimeout(focusInput, DROPDOWN_CONSTANTS.TIMEOUTS.FOCUS_RETRY_1));
        timeoutIds.push(setTimeout(focusInput, DROPDOWN_CONSTANTS.TIMEOUTS.FOCUS_RETRY_2));
        timeoutIds.push(setTimeout(focusInput, DROPDOWN_CONSTANTS.TIMEOUTS.FOCUS_RETRY_3));

        // Cleanup function to clear timeouts
        return () => {
          timeoutIds.forEach(clearTimeout);
        };
      }
    }, [open, autoFocus]);

    // Handle scroll event for load more functionality
    const handleScroll = useCallback(
      event => {
        if (onScroll) {
          const { scrollTop, scrollHeight, clientHeight } = event.target;
          // Check if user has scrolled to within 3.125rem (50px) of the bottom
          const threshold = 50;
          const isNearBottom = scrollTop + clientHeight >= scrollHeight - threshold;

          if (isNearBottom && items.length > 0 && !isLoading) {
            onScroll();
          }
        }
      },
      [onScroll, items.length, isLoading],
    );

    // Function to get tooltip message for interrupted items
    const getInterruptTooltipMessage = useCallback(item => {
      const itemName = item.label || item.name || 'Pipeline';
      return `The ${itemName} pipeline can't be added as a toolkit as it contains interruptions in subgraphs, which are not allowed.`;
    }, []);

    // Function to check if item should be disabled
    const isItemDisabled = useCallback(item => {
      return Boolean(item.has_interrupt);
    }, []);

    // Enhanced item click handler
    const handleItemClick = useCallback(
      item => {
        return event => {
          // Prevent click action for disabled items
          if (isItemDisabled(item)) {
            event.preventDefault();
            event.stopPropagation();
            return;
          }

          // Call the original onClick handler
          if (item.onClick) {
            item.onClick(event);
          }
        };
      },
      [isItemDisabled],
    );

    return (
      <Popper
        open={open}
        anchorEl={anchorEl}
        role={undefined}
        placement={preferLeft ? 'left-start' : 'bottom-start'}
        strategy="fixed"
        modifiers={[
          // For left placement, increase horizontal distance from the rail (1rem = 16px, 0.5rem = 8px)
          { name: 'offset', options: { offset: preferLeft ? [0, 16] : [0, 8] } },
          // Avoid flipping when we explicitly request left
          { name: 'flip', enabled: !preferLeft },
          // Keep within viewport and render above other UI
          { name: 'preventOverflow', options: { boundary: 'viewport', altBoundary: true, tether: true } },
        ]}
        transition
        sx={[styles.paper, sx]}
      >
        {({ TransitionProps, placement: popperPlacement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin: popperPlacement?.startsWith('left')
                ? 'right center'
                : popperPlacement?.startsWith('right')
                  ? 'left center'
                  : popperPlacement === 'bottom'
                    ? 'center top'
                    : 'center bottom',
            }}
          >
            <Paper sx={styles.paperSx(preferLeft)}>
              <ClickAwayListener onClickAway={onClose}>
                <Box>
                  {/* Fixed Search Section */}
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
                        autoFocus={autoFocus}
                        InputProps={{
                          disableUnderline: true,
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Scrollable Content Area */}
                  <Box
                    ref={scrollRef}
                    onScroll={handleScroll}
                    sx={styles.scrollableContent}
                  >
                    {/* Create New Item */}
                    {showCreateNew && (
                      <Tooltip
                        title={createNewLabel}
                        placement="right"
                      >
                        <MenuItem
                          onClick={onCreateNew}
                          sx={styles.createNewItemStyles}
                        >
                          <PlusIcon
                            style={styles.plusIcon}
                            fill={theme.palette.icon.fill.secondary}
                          />
                          <Box sx={styles.createNewLabelContainer}>
                            <Typography
                              variant="bodyMedium"
                              color="text.secondary"
                              sx={styles.ellipsisText}
                            >
                              {createNewLabel}
                            </Typography>
                          </Box>
                        </MenuItem>
                      </Tooltip>
                    )}

                    {/* Divider */}
                    {showCreateNew && showDivider && items.length > 0 && (
                      <Box sx={styles.dividerContainer}>
                        <Box sx={styles.dividerLine(theme)} />
                      </Box>
                    )}

                    {/* Items List */}
                    {items.map(item => {
                      const disabled = isItemDisabled(item);
                      const itemStyles = styles.listItemStyles(disabled);
                      const needShowPublicLabel =
                        showPublicLabel && item.data?.project_id == PUBLIC_PROJECT_ID;
                      const labelContainer = needShowPublicLabel
                        ? styles.labelContainerWithPublic
                        : styles.labelContainer;
                      // For items with has_interrupt flag, wrap in tooltip
                      if (disabled) {
                        return (
                          <Tooltip
                            key={item.key || item.id || item.value || item.label}
                            title={getInterruptTooltipMessage(item)}
                            placement="right"
                            arrow
                          >
                            <span>
                              {' '}
                              {/* Span wrapper needed for disabled MenuItem tooltip */}
                              <MenuItem
                                disabled
                                sx={itemStyles}
                                onClick={handleItemClick(item)}
                              >
                                {/* Icon */}
                                <Box sx={styles.iconContainer(true)}>{item.icon}</Box>
                                {/* Label */}
                                <Box sx={styles.labelContainer}>
                                  <Typography
                                    variant="bodyMedium"
                                    color="text.disabled"
                                    sx={styles.ellipsisText}
                                  >
                                    {item.label}
                                  </Typography>
                                </Box>
                                {needShowPublicLabel && (
                                  <Box sx={styles.publicLabelContainer}>
                                    <Typography
                                      variant="bodySmall"
                                      sx={styles.publicLabel}
                                    >
                                      {'Public'}
                                    </Typography>
                                  </Box>
                                )}
                              </MenuItem>
                            </span>
                          </Tooltip>
                        );
                      }

                      // Regular enabled items
                      return (
                        <MenuItem
                          key={item.key || item.id || item.value || item.label}
                          onClick={handleItemClick(item)}
                          sx={itemStyles}
                        >
                          {/* Icon */}
                          <Box sx={styles.iconContainer(false)}>{item.icon}</Box>
                          {/* Label */}
                          <Box sx={labelContainer}>
                            <TypographyWithConditionalTooltip
                              title={item.label}
                              placement="right"
                              variant="bodyMedium"
                              color="text.secondary"
                            >
                              {item.label}
                            </TypographyWithConditionalTooltip>
                          </Box>
                          {needShowPublicLabel && (
                            <Box sx={styles.publicLabelContainer}>
                              <Typography
                                variant="bodySmall"
                                sx={styles.publicLabel}
                              >
                                {'Public'}
                              </Typography>
                            </Box>
                          )}
                        </MenuItem>
                      );
                    })}

                    {/* Loading Message */}
                    {isLoading && (
                      <MenuItem
                        disabled
                        sx={styles.listItemStyles(true)}
                      >
                        <Box sx={styles.messageContainer}>
                          <Typography
                            variant="bodyMedium"
                            sx={styles.messageText}
                          >
                            Loading...
                          </Typography>
                        </Box>
                      </MenuItem>
                    )}

                    {/* No Results Message */}
                    {!isLoading && items.length === 0 && (
                      <MenuItem
                        disabled
                        sx={styles.listItemStyles(true)}
                      >
                        <Box sx={styles.messageContainer}>
                          <Typography
                            variant="bodyMedium"
                            sx={styles.messageText}
                          >
                            {searchValue ? noResultsMessage : emptyMessage}
                          </Typography>
                        </Box>
                      </MenuItem>
                    )}
                  </Box>
                </Box>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    );
  },
);

UnifiedDropdown.displayName = 'UnifiedDropdown';

/** @type {MuiSx} */
const styles = {
  paper: theme => ({ zIndex: theme.zIndex.modal ? theme.zIndex.modal + 10 : 2200 }),
  searchContainer: ({ palette }) => ({
    padding: `${SPACING.XS} ${SPACING.LG}`, // 4px 16px
    borderBottom: `1px solid ${palette.border.lines}`,
    height: DROPDOWN_CONSTANTS.DIMENSIONS.ITEM_HEIGHT,
    display: 'flex',
    alignItems: 'center',
  }),
  searchInnerContainer: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    gap: '0.625rem', // 10px
  },
  searchIcon: {
    width: '1.25rem', // 20px
    height: '1.25rem', // 20px
  },
  searchField: ({ palette }) => ({
    width: '100%',
    '& .MuiOutlinedInput-root': {
      fontFamily: 'Montserrat',
      backgroundColor: 'transparent',
      border: 'none',
      height: DROPDOWN_CONSTANTS.DIMENSIONS.SEARCH_FIELD_HEIGHT,
      '& fieldset': {
        border: 'none',
      },
      '&:hover fieldset': {
        border: 'none',
      },
      '&.Mui-focused fieldset': {
        border: 'none',
      },
    },
    '& .MuiInputBase-input': {
      padding: '0',
      color: palette.text.primary,
      '&::placeholder': {
        color: palette.text.disabled,
        opacity: 1,
      },
    },
  }),
  scrollableContent: {
    height: 'auto',
    maxHeight: '20.3125rem', // 325px
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  plusIcon: {
    width: '1rem', // 16px
    height: '1rem', // 16px
  },
  createNewLabelContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '0.25rem', // 4px
    width: '10rem', // 160px
  },
  ellipsisText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  dividerContainer: {
    padding: '0 0 0.25rem', // 0px 0px 4px
    height: '0.3125rem', // 5px
  },
  dividerLine: ({ palette }) => ({
    width: '14.25rem', // 228px
    height: '1px',
    backgroundColor: palette.border.lines,
  }),
  iconContainer:
    isDisabled =>
    ({ palette }) => ({
      width: '1.25rem', // 20px
      height: '1.25rem', // 20px
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      '& svg path': {
        fill: isDisabled ? palette.icon.fill.disabled : palette.icon.fill.secondary,
      },
    }),
  labelContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '0.5rem', // 8px
    width: '10.5rem', // 168px
  },
  labelContainerWithPublic: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '0.5rem', // 8px
    width: '7rem', // 136px
    maxWidth: '7rem', // 136px
  },
  publicLabelContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: '0.125rem 0.375rem', // 2px 6px
    borderRadius: '0.875rem', // 8px
    border: ({ palette }) => `1px solid ${palette.border.lines}`,
  },
  messageContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '0.25rem', // 4px
    width: '10.5rem', // 168px
  },
  messageText: ({ palette }) => ({
    color: palette.text.secondary,
  }),

  // Paper styles - dynamic height based on content
  paperSx:
    preferLeft =>
    ({ palette }) => ({
      borderRadius: DROPDOWN_CONSTANTS.BORDER_RADIUS.MENU,
      marginTop: preferLeft ? 0 : DROPDOWN_CONSTANTS.SPACING.MENU_TOP_MARGIN,
      border: `1px solid ${palette.border.lines}`,
      background: palette.background.secondary,
      boxShadow: palette.boxShadow.default,
      width: DROPDOWN_CONSTANTS.DIMENSIONS.MENU_WIDTH,
      maxHeight: DROPDOWN_CONSTANTS.DIMENSIONS.MENU_MAX_HEIGHT,
    }),

  // Menu item styles for "Create new" item - exact Figma specs
  createNewItemStyles: ({ palette }) => ({
    padding: `${SPACING.SM} ${SPACING.XL}`, // 8px 20px - Figma padding for "Create New" item
    height: DROPDOWN_CONSTANTS.DIMENSIONS.ITEM_HEIGHT,
    gap: DROPDOWN_CONSTANTS.SPACING.ITEM_ICON_TEXT_GAP,
    color: palette.text.primary,
    '&:hover': {
      backgroundColor: palette.background.select.hover,
    },
  }),

  // Enhanced menu item styles for disabled items
  listItemStyles:
    (isDisabled = false) =>
    ({ palette }) => ({
      padding: `${SPACING.SM} ${SPACING.LG}`, // 8px 16px - Figma padding for regular items
      height: DROPDOWN_CONSTANTS.DIMENSIONS.ITEM_HEIGHT,
      gap: DROPDOWN_CONSTANTS.SPACING.ITEM_REGULAR_GAP,
      color: isDisabled ? palette.text.disabled : palette.text.primary,
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      opacity: isDisabled ? 0.6 : 1,
      '&:hover': {
        backgroundColor: isDisabled ? 'transparent' : palette.background.select.hover,
      },
      '&.Mui-disabled': {
        opacity: 0.6,
        color: palette.text.disabled,
      },
    }),
  publicLabel: {
    textTransform: 'none', // Don't capitalize the public label
    color: ({ palette }) => palette.text.metrics,
  },
};

export default UnifiedDropdown;
