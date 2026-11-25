// Chat concept: one kind's list in the «+» menu (Agents, Pipelines, Skills, Toolkits, MCPs). A copy of
// src/[fsd]/features/chat/ui/chat-button/PlusChatSubmenu.jsx; the lines marked «concept:» are the changes, the rest
// (search with autofocus, «Create <Kind>» and the line under it, loading on scroll, empty and not-found rows, the
// Catalog label, the switch of toolkits and MCPs) is the team's code.
// - concept: a row has two lines, the name and the description (today: the name only), so the list is 600 px wide;
// - concept: without a search, rows already in the chat sit on top under «In this chat · N», the others under
//   «All agents · N» (or «Agents · N» when none is in the chat); the sections are taken when the list opens, so a row
//   does not jump away under the pointer when it is added or removed; «In this chat · N» counts the rows still in it;
// - concept: an agent, pipeline or skill in the chat shows a check in icon.secondary, as a selected row of the
//   product's lists (AutoCompleteDropDown, FolderMenuContent; today such a row is hidden); under the pointer or focus
//   the check gives way to the product's delete icon button (DeleteParticipantButton: DeleteIcon, «Remove agent»), and
//   only that button removes it — a click on the row does nothing. Such a row drops the Catalog label;
// - concept: under the rows «Scroll for more · 20 of 116» while more can load, «Loading...» while it loads.
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Raw MUI controls as in the team's PlusChatSubmenu, which this file copies
import { Box, IconButton, MenuItem, Switch, TextField, Typography, useTheme } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { ParticipantEntityConstants } from '@/[fsd]/shared/lib/constants';
import { BaseListSubheader } from '@/[fsd]/shared/ui/list';
import { TypographyWithConditionalTooltip } from '@/[fsd]/shared/ui/tooltip';
import { PUBLIC_PROJECT_ID } from '@/common/constants';
import { HEIGHTS, SPACING } from '@/common/designTokens';
import CheckIcon from '@/components/Icons/CheckIcon';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import PlusIcon from '@/components/Icons/PlusIcon';
import SearchIcon from '@/components/Icons/SearchIcon';

const FOCUS_DELAYS = [50, 150, 300];
const SCROLL_THRESHOLD = 50;

const ConceptPlusSubmenu = memo(props => {
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
    publicLabel = ParticipantEntityConstants.CATALOG_LABEL,
    showToggle = false,
    sectionKey,
    // concept: the sections and the counts
    inChat = [],
    total = 0,
    kindLabel = 'Items',
    allLabel = 'All items',
    removeLabel = 'Remove from chat',
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

  // concept: the rows that were in the chat when the list opened (taken once the first page has loaded)
  const [openedInChat, setOpenedInChat] = useState(null);
  useEffect(() => {
    if (openedInChat === null && !isLoading && items.length > 0) setOpenedInChat(new Set(inChat));
  }, [openedInChat, isLoading, items.length, inChat]);

  const sections = useMemo(() => {
    if (searchValue || !openedInChat) return null;
    const inChatRows = items.filter(item => openedInChat.has(item.key));
    const otherRows = items.filter(item => !openedInChat.has(item.key));
    // concept: the head counts the rows still in the chat; a row removed here keeps its place, without its check
    const inChatNow = new Set(inChat);
    const inChatCount = inChatRows.filter(item => inChatNow.has(item.key)).length;
    return {
      inChatRows,
      inChatCount,
      otherRows,
      otherTotal: Math.max(total - inChatRows.length, otherRows.length),
    };
  }, [searchValue, openedInChat, items, total, inChat]);

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

  // concept: the delete icon removes an added row; the click does not reach the row
  const handleRemove = useCallback(
    item => event => {
      event.stopPropagation();
      item.onRemove?.();
    },
    [],
  );

  const handleToggle = useCallback(
    item => event => {
      event.stopPropagation();
      item.onToggle?.();
    },
    [],
  );

  const styles = conceptPlusSubmenuStyles(theme);

  const renderRow = item => {
    const isPublic = showPublicLabel && item.data?.project_id == PUBLIC_PROJECT_ID;
    // concept: a row already in the chat
    const isAdded = !showToggle && !!item.added;

    return (
      <MenuItem
        key={item.key}
        data-testid={sectionKey ? `${sectionKey}-menu-item-${item.key}` : undefined}
        onClick={showToggle ? handleToggle(item) : isAdded ? undefined : handleItemClick(item)}
        disabled={showToggle && item.pending}
        sx={isAdded ? styles.addedItem : styles.listItem}
      >
        <Box sx={styles.iconContainer}>{item.icon}</Box>
        {/* concept: the name and, under it, the description */}
        <Box sx={styles.labelContainer}>
          <TypographyWithConditionalTooltip
            title={item.label}
            placement="right"
            popperSx={styles.tooltipPopper}
            variant="labelMedium"
            color="text.secondary"
          >
            {item.label}
          </TypographyWithConditionalTooltip>
          {item.description && (
            <Typography
              variant="bodySmall"
              color="text.primary"
              sx={styles.description}
            >
              {item.description}
            </Typography>
          )}
        </Box>
        {/* concept: no Catalog label on a row already in the chat */}
        {isPublic && !isAdded && (
          <Box sx={styles.publicLabelContainer}>
            <Typography
              variant="bodySmall"
              sx={styles.publicLabel}
            >
              {publicLabel}
            </Typography>
          </Box>
        )}
        {/* concept: a check on a row in the chat; under the pointer the product's delete icon, which alone removes it */}
        {isAdded && (
          <Box
            sx={styles.added}
            data-testid={sectionKey ? `${sectionKey}-added-${item.key}` : undefined}
          >
            <CheckIcon
              className="concept-added"
              sx={styles.checkIcon}
              fill={theme.palette.icon.secondary}
            />
            <Tooltip
              title={removeLabel}
              placement="top"
              slotProps={{ popper: { sx: styles.tooltipPopper } }}
            >
              <IconButton
                className="concept-remove"
                variant="elitea"
                color="tertiary"
                aria-label={removeLabel}
                onClick={handleRemove(item)}
                sx={styles.removeButton}
                data-testid={sectionKey ? `${sectionKey}-remove-${item.key}` : undefined}
              >
                <DeleteIcon sx={styles.deleteIcon} />
              </IconButton>
            </Tooltip>
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
  };

  // concept: a section head, as the team's discovery search draws its sections (BaseListSubheader, subtitle type)
  const renderHead = (label, count) => (
    <BaseListSubheader
      key={label}
      sx={styles.sectionHead}
    >
      {label}
      <Box
        component="span"
        sx={styles.sectionCount}
      >
        {count}
      </Box>
    </BaseListSubheader>
  );

  const shownOthers = sections ? sections.otherRows.length : items.length;
  const othersTotal = sections ? sections.otherTotal : total;

  return (
    <Box sx={styles.root}>
      <Box sx={styles.searchContainer}>
        <Box sx={styles.searchInnerContainer}>
          <SearchIcon
            style={styles.searchIcon}
            fill={theme.palette.icon.default}
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
            inputProps={sectionKey ? { 'data-testid': `${sectionKey}-search-input` } : undefined}
          />
        </Box>
      </Box>

      {showCreateNew && (
        <MenuItem
          onClick={onCreateNew}
          sx={styles.createNewItem}
          data-testid={sectionKey ? `${sectionKey}-create-new-button` : undefined}
        >
          <PlusIcon
            style={styles.plusIcon}
            fill={theme.palette.icon.default}
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

      {showCreateNew && (
        <Box sx={styles.dividerContainer}>
          <Box sx={styles.dividerLine} />
        </Box>
      )}

      <Box
        ref={scrollRef}
        onScroll={handleScroll}
        sx={styles.scrollableContent}
      >
        {sections ? (
          <>
            {sections.inChatRows.length > 0 && renderHead('In this chat', sections.inChatCount)}
            {sections.inChatRows.map(renderRow)}
            {sections.otherRows.length > 0 &&
              renderHead(sections.inChatRows.length > 0 ? allLabel : kindLabel, sections.otherTotal)}
            {sections.otherRows.map(renderRow)}
          </>
        ) : (
          items.map(renderRow)
        )}

        {isLoading && (
          <MenuItem
            disabled
            sx={styles.statusItem}
          >
            <Typography
              variant="bodyMedium"
              color="text.secondary"
            >
              Loading...
            </Typography>
          </MenuItem>
        )}

        {/* concept: how much is left to load */}
        {!isLoading && items.length > 0 && shownOthers < othersTotal && (
          <Box sx={styles.scrollMore}>
            <Typography
              variant="bodySmall"
              color="text.primary"
            >
              {`Scroll for more · ${shownOthers} of ${othersTotal}`}
            </Typography>
          </Box>
        )}

        {!isLoading && items.length === 0 && (
          <MenuItem
            disabled
            sx={styles.statusItem}
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

ConceptPlusSubmenu.displayName = 'ConceptPlusSubmenu';

/** @type {MuiSx} */
const conceptPlusSubmenuStyles = theme => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: 0,
  },
  searchContainer: {
    flexShrink: 0,
    padding: `${SPACING.XS} ${SPACING.LG}`,
    borderBottom: `0.0625rem solid ${theme.palette.border.lines}`,
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
      color: theme.palette.text.secondary,
      '&::placeholder': {
        color: theme.palette.text.disabled,
        opacity: 1,
      },
    },
  },
  tooltipPopper: {
    // Must sit above the submenu Popper (zIndex 9999 in PlusChatButton)
    zIndex: 10000,
  },
  scrollableContent: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  plusIcon: {
    width: '1rem',
    height: '1rem',
  },
  createNewItem: {
    flexShrink: 0,
    padding: `${SPACING.SM} ${SPACING.XL}`,
    height: HEIGHTS.buttonLarge,
    gap: '0.75rem',
    color: theme.palette.text.primary,
    '&:hover': {
      backgroundColor: theme.palette.background.interactiveItem.hover,
    },
  },
  dividerContainer: {
    flexShrink: 0,
    padding: '0 0 0.25rem',
    height: '0.3125rem',
  },
  dividerLine: {
    width: '100%',
    height: 0,
    borderBottom: `0.0625rem solid ${theme.palette.border.lines}`,
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
  // concept: two lines — name, description
  labelContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    flex: 1,
    minWidth: 0,
  },
  description: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  publicLabelContainer: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.125rem 0.375rem',
    borderRadius: '0.875rem',
    border: `0.0625rem solid ${theme.palette.border.lines}`,
    flexShrink: 0,
  },
  publicLabel: {
    textTransform: 'none',
    color: theme.palette.text.metrics,
  },
  // concept: a two-line row (dev: one line, 2.5rem)
  listItem: {
    padding: `${SPACING.XS} ${SPACING.LG}`,
    minHeight: '3rem',
    flexShrink: 0,
    gap: '0.75rem',
    color: theme.palette.text.primary,
    '&:hover': {
      backgroundColor: theme.palette.background.interactiveItem.hover,
    },
  },
  statusItem: {
    padding: `${SPACING.SM} ${SPACING.LG}`,
    height: HEIGHTS.buttonLarge,
    flexShrink: 0,
  },
  // concept: a row in the chat is not clicked as a whole — only its delete icon acts
  addedItem: {
    padding: `${SPACING.XS} ${SPACING.LG}`,
    minHeight: '3rem',
    flexShrink: 0,
    gap: '0.75rem',
    cursor: 'default',
    color: theme.palette.text.primary,
    '&:hover': {
      backgroundColor: theme.palette.background.interactiveItem.hover,
    },
    // the keyboard reaches the delete icon too: a focused row shows it as the pointer does
    '&:hover .concept-added, &:focus-within .concept-added': { display: 'none' },
    '&:hover .concept-remove, &:focus-within .concept-remove': { display: 'inline-flex' },
  },
  // concept: the check and the delete icon take the same place, the size of the product's delete button
  added: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '1.75rem',
    height: '1.75rem',
    flexShrink: 0,
  },
  checkIcon: {
    fontSize: '1rem',
  },
  removeButton: {
    display: 'none',
    width: '1.75rem',
    height: '1.75rem',
  },
  deleteIcon: {
    fontSize: '1rem',
  },
  sectionHead: ({ palette, typography }) => ({
    ...typography.subtitle,
    gap: '0.5rem',
    padding: '0.75rem 1rem 0.25rem',
    lineHeight: '1rem',
    color: palette.text.primary,
    position: 'static',
  }),
  sectionCount: ({ palette }) => ({
    color: palette.text.disabled,
  }),
  scrollMore: {
    padding: `${SPACING.SM} ${SPACING.LG}`,
    flexShrink: 0,
  },
});

export default ConceptPlusSubmenu;
