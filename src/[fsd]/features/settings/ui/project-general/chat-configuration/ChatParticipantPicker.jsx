import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Autocomplete, Box, Chip, InputAdornment, TextField, Typography, useTheme } from '@mui/material';

import { getChatParticipantUniqueId } from '@/[fsd]/features/chat/participants/lib/helpers';
import { ChatParticipantConstants } from '@/[fsd]/features/settings/lib/constants';
import { ChatParticipantHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { useIsMcpVisible } from '@/[fsd]/shared/lib/hooks';
import RemoveIcon from '@/assets/remove-icon.svg?react';
import SearchIcon from '@/components/Icons/SearchIcon';
import useParticipants from '@/hooks/chat/useParticipants';

import ChatParticipantIcon from './ChatParticipantIcon';
import ChatParticipantOption from './ChatParticipantOption';
import ChatParticipantPickerPaper from './ChatParticipantPickerPaper';

const { TABS, TAB_LABELS, TAB_FETCH_TYPES } = ChatParticipantConstants;

const { getEntityName, filterFetchedForTab } = ChatParticipantHelpers;

const SEARCH_PLACEHOLDER = 'Search participants...';

// SearchIcon draws a 16.5-unit glyph on a 24-unit canvas; crop it so the glyph is 14px in a 16px box
const SEARCH_ICON_VIEWBOX = '2.57 1.82 18.86 18.86';

const EMPTY_OPTIONS = [];

// `useParticipants` gives no signal when a source has nothing left to load, so a load-more that does
// not start a request within this window is treated as "end of list"
const LOAD_MORE_START_TIMEOUT_MS = 1000;

const POPPER_MODIFIERS = [{ name: 'flip', enabled: false }];

// Picker participants use flat `id`/`project_id` rather than `entity_meta`; adapt to the shared helper.
const makeParticipantKey = p =>
  getChatParticipantUniqueId({
    entity_name: p.entity_name,
    entity_meta: { id: p.id, project_id: p.project_id },
  });

const isSameParticipant = (option, value) => makeParticipantKey(option) === makeParticipantKey(value);

const getParticipantName = participant => participant?.name ?? '';

// Options are fetched already filtered by the search query
const keepRemoteOptions = options => options;

const ChatParticipantPicker = memo(props => {
  const { participants = [], onChange, isTeamProject = false, disabled = false } = props;

  const theme = useTheme();
  const hasParticipants = participants.length > 0;
  const styles = useMemo(() => chatParticipantPickerStyles(), []);
  const isMcpVisible = useIsMcpVisible();

  const [activeTab, setActiveTab] = useState(TABS.AGENTS);
  const [query, setQuery] = useState('');

  const tabItems = useMemo(
    () =>
      Object.values(TABS)
        .filter(tab => {
          if (tab === TABS.MCPS && !isMcpVisible) return false;
          if (tab === TABS.USERS && !isTeamProject) return false;
          return true;
        })
        .map(tab => ({ value: tab, label: TAB_LABELS[tab] })),
    [isMcpVisible, isTeamProject],
  );

  const {
    participants: fetched,
    isFetching,
    isFirstPageFetching,
    onLoadMore,
  } = useParticipants({
    sortBy: 'name',
    sortOrder: 'asc',
    query,
    pageSize: 50,
    types: TAB_FETCH_TYPES[activeTab],
  });

  // A load-more was requested and has not settled yet
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  // After the first load-more in a tab/search, keep shown items in place and append new pages
  const [isAppendMode, setIsAppendMode] = useState(false);
  const hasLoadMoreFetchStartedRef = useRef(false);
  // `fetched.length` at the moment a load-more turned out to have nothing left to fetch
  const exhaustedAtCountRef = useRef(null);
  // Last known listbox scroll position, restored after a loaded page is appended (see below)
  const listboxScrollRef = useRef({ node: null, scrollTop: 0 });

  const resetPaging = useCallback(() => {
    setIsLoadingMore(false);
    setIsAppendMode(false);
    exhaustedAtCountRef.current = null;
  }, []);

  // Settle a load-more: done once its request finished, or abandoned if no request ever started
  useEffect(() => {
    if (!isLoadingMore) return undefined;
    if (isFetching) {
      hasLoadMoreFetchStartedRef.current = true;
      return undefined;
    }
    if (hasLoadMoreFetchStartedRef.current) {
      hasLoadMoreFetchStartedRef.current = false;
      setIsLoadingMore(false);
      return undefined;
    }
    const timer = setTimeout(() => {
      exhaustedAtCountRef.current = fetched.length;
      setIsLoadingMore(false);
    }, LOAD_MORE_START_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isLoadingMore, isFetching, fetched.length]);

  const handleListboxScroll = useCallback(
    event => {
      const el = event.currentTarget;
      listboxScrollRef.current = { node: el, scrollTop: el.scrollTop };
      if (
        isLoadingMore ||
        isFetching ||
        isFirstPageFetching ||
        exhaustedAtCountRef.current === fetched.length
      )
        return;
      if (el.scrollHeight > el.clientHeight && el.scrollTop + el.clientHeight >= el.scrollHeight - 80) {
        hasLoadMoreFetchStartedRef.current = false;
        setIsLoadingMore(true);
        setIsAppendMode(true);
        onLoadMore();
      }
    },
    [isLoadingMore, isFetching, isFirstPageFetching, fetched.length, onLoadMore],
  );

  // Display position of every option already shown, so a loaded page is appended below them
  const optionOrderRef = useRef(new Map());

  const options = useMemo(() => {
    const mapped = filterFetchedForTab(fetched, activeTab).map(p => ({
      id: p.id,
      name: p.name,
      project_id: p.project_id,
      entity_name: getEntityName(p),
      agent_type: p.agent_type ?? null,
      // toolkit_type is used to resolve the correct toolkit icon
      toolkit_type: p.type ?? null,
      avatar: p.avatar ?? null,
    }));

    // `useParticipants` merges several sources (project + public) and re-sorts the whole list by
    // name on every page, which would shuffle items the user has already scrolled past. Once paging
    // started, keep the existing order and append newcomers; before that, the natural (sorted) order
    // is the baseline.
    if (!isAppendMode) optionOrderRef.current = new Map();
    const order = optionOrderRef.current;
    mapped.forEach(option => {
      const key = makeParticipantKey(option);
      if (!order.has(key)) order.set(key, order.size);
    });
    return mapped.sort((a, b) => order.get(makeParticipantKey(a)) - order.get(makeParticipantKey(b)));
  }, [fetched, activeTab, isAppendMode]);

  // MUI Autocomplete resets its highlight when the option count changes and, with no matching
  // highlighted option, scrolls the listbox to the top — which throws the user back to the start
  // every time a page is appended. MUI does that in a passive effect of the (child) Autocomplete,
  // which runs before this one, so restoring here wins. Pages from several sources (e.g. project +
  // public agents) can land separately, so keep restoring until the load-more settles.
  useEffect(() => {
    if (!isLoadingMore) return;
    const { node, scrollTop } = listboxScrollRef.current;
    if (node?.isConnected) node.scrollTop = scrollTop;
  }, [options.length, isFetching, isLoadingMore]);

  // Agents/pipelines/toolkits come from several requests (project + public) that resolve separately.
  // During the first page — not a load-more — hide partial results until every source answered, so
  // the list does not show a few items and then reshuffle when the rest arrive.
  // Toolkits/MCPs report their first page via `isFirstPageFetching` only, not `isFetching`
  const isInitialLoading = (isFetching || isFirstPageFetching) && !isLoadingMore;
  const visibleOptions = isInitialLoading ? EMPTY_OPTIONS : options;

  const handleTabChange = useCallback(
    (_, tab) => {
      setActiveTab(tab);
      setQuery('');
      resetPaging();
    },
    [resetPaging],
  );

  const handleChange = useCallback(
    (_, newParticipants) => {
      if (disabled) return;
      onChange(newParticipants);
    },
    [disabled, onChange],
  );

  // Keep the search text while picking several options; only typing or clearing changes it
  const handleInputChange = useCallback(
    (_, value, reason) => {
      if (reason !== 'input' && reason !== 'clear') return;
      setQuery(value);
      resetPaging();
    },
    [resetPaging],
  );

  const handleClose = useCallback(() => {
    setQuery('');
    resetPaging();
  }, [resetPaging]);

  // Keep the newest chip and the caret in view once the field starts scrolling
  const rootRef = useRef(null);
  const prevParticipantsCountRef = useRef(participants.length);

  useEffect(() => {
    if (participants.length > prevParticipantsCountRef.current) {
      const inputRoot = rootRef.current?.querySelector('.MuiAutocomplete-inputRoot');
      if (inputRoot) inputRoot.scrollTop = inputRoot.scrollHeight;
    }
    prevParticipantsCountRef.current = participants.length;
  }, [participants.length]);

  const renderOption = useCallback((optionProps, option) => {
    const { key, ...restOptionProps } = optionProps;
    return (
      <Box
        component="li"
        key={key}
        {...restOptionProps}
      >
        <ChatParticipantOption option={option} />
      </Box>
    );
  }, []);

  const renderValue = useCallback(
    (selected, getItemProps) =>
      selected.map((participant, index) => {
        const { key, onDelete, ...itemProps } = getItemProps({ index });
        return (
          <Chip
            key={key}
            {...itemProps}
            label={
              <Box sx={styles.chipLabel}>
                <ChatParticipantIcon participant={participant} />
                <Typography
                  variant="bodySmall"
                  color="text.secondary"
                >
                  {participant.name}
                </Typography>
              </Box>
            }
            deleteIcon={<RemoveIcon fill={theme.palette.icon.default} />}
            // Always pass onDelete so the ✕ stays visible while saving; the disabled chip blocks clicks
            onDelete={onDelete}
            disabled={disabled}
            sx={styles.chip}
          />
        );
      }),
    [disabled, styles, theme],
  );

  // Plain MUI TextField on purpose: Input.InputBase auto-blurs on change, which would close the dropdown
  // on every keystroke
  const renderInput = useCallback(
    params => (
      <TextField
        {...params}
        variant="standard"
        sx={styles.textField}
        placeholder={hasParticipants ? '' : SEARCH_PLACEHOLDER}
        slotProps={{
          input: {
            ...params.InputProps,
            // The underline is drawn on the field container so it stays put while the chips scroll
            disableUnderline: true,
            startAdornment: hasParticipants ? (
              params.InputProps.startAdornment
            ) : (
              <InputAdornment
                position="start"
                sx={styles.searchAdornment}
              >
                <SearchIcon
                  width={16}
                  height={16}
                  viewBox={SEARCH_ICON_VIEWBOX}
                  fill={theme.palette.icon.default}
                />
              </InputAdornment>
            ),
          },
          htmlInput: {
            ...params.inputProps,
            'data-testid': 'chat-template-participants-input',
          },
        }}
      />
    ),
    [hasParticipants, styles, theme],
  );

  const emptyText = query
    ? `No ${TAB_LABELS[activeTab].toLowerCase()} match "${query}".`
    : `No ${TAB_LABELS[activeTab].toLowerCase()} available.`;

  const slotProps = useMemo(
    () => ({
      paper: {
        tabs: tabItems,
        activeTab,
        onTabChange: handleTabChange,
        // MUI only shows its loading text for an empty list; show a footer spinner for next pages
        // Spinner only while a page request is actually running
        isLoadingMore: isLoadingMore && isFetching && options.length > 0,
      },
      listbox: { onScroll: handleListboxScroll, sx: styles.listbox },
      // Always open above the field (not enough room below inside the modal); flipping while
      // results load makes the dropdown jump
      popper: { placement: 'top-start', modifiers: POPPER_MODIFIERS },
    }),
    [
      tabItems,
      activeTab,
      handleTabChange,
      isLoadingMore,
      isFetching,
      options.length,
      handleListboxScroll,
      styles,
    ],
  );

  return (
    <Autocomplete
      multiple
      openOnFocus
      disableCloseOnSelect
      forcePopupIcon={false}
      options={visibleOptions}
      value={participants}
      onChange={handleChange}
      inputValue={query}
      onInputChange={handleInputChange}
      onClose={handleClose}
      filterOptions={keepRemoteOptions}
      getOptionLabel={getParticipantName}
      getOptionKey={makeParticipantKey}
      isOptionEqualToValue={isSameParticipant}
      loading={isInitialLoading}
      loadingText="Loading…"
      noOptionsText={emptyText}
      disabled={disabled}
      renderOption={renderOption}
      renderValue={renderValue}
      renderInput={renderInput}
      slots={{ paper: ChatParticipantPickerPaper }}
      slotProps={slotProps}
      ref={rootRef}
      sx={styles.root}
      data-testid="chat-template-participants-picker"
    />
  );
});

ChatParticipantPicker.displayName = 'ChatParticipantPicker';

/** @type {MuiSx} */
const chatParticipantPickerStyles = () => ({
  root: ({ palette, typography }) => ({
    width: '100%',
    // `&&` outranks MUI's own Autocomplete/Input padding rules
    '&& .MuiAutocomplete-inputRoot': {
      // Static so the clear button anchors to the field container and does not scroll with chips
      position: 'static',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: '0.5rem',
      minHeight: '2.5rem',
      // Three rows of chips (3 × 1.75rem + 2 × 0.5rem gap) plus vertical padding, then scroll
      maxHeight: '7.25rem',
      overflowY: 'auto',
      padding: '0.5rem 2rem 0.5rem 0.75rem',
      boxSizing: 'border-box',
    },
    '&& .MuiAutocomplete-input': {
      ...typography.bodyMedium,
      height: '1.5rem',
      padding: 0,
      // The theme's standard TextField adds a bottom margin under inputs; the root padding covers it
      marginBottom: 0,
      color: palette.text.secondary,
      '&::placeholder': {
        color: palette.text.primary,
        opacity: 1,
      },
    },
  }),
  // Drop the theme's standard TextField top padding; the field spacing comes from the input root
  textField: ({ palette }) => ({
    padding: 0,
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
    '&:hover:not(:has(.Mui-disabled))': {
      borderBottomColor: palette.border.hover,
    },
    '&:focus-within': {
      borderBottomColor: palette.primary.main,
    },
  }),
  searchAdornment: {
    height: '1rem',
    maxHeight: 'none',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
  },
  chip: ({ palette }) => ({
    height: '1.75rem',
    padding: '0.125rem',
    margin: '0 !important',
    backgroundColor: palette.components.styledChip.background.disabled,
    '& .MuiChip-label': {
      paddingLeft: '0.5rem',
      paddingRight: '0.5rem',
    },
    '& .MuiChip-deleteIcon': {
      color: palette.icon.default,
      marginLeft: 0,
      '&:hover': {
        color: palette.icon.secondary,
      },
    },
  }),
  chipLabel: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'row',
    gap: '0.375rem',
  },
  listbox: ({ palette }) => ({
    padding: '0.25rem 0',
    '& .MuiAutocomplete-option': {
      minHeight: '2.5rem',
      padding: '0.5rem 1rem',
      '&:hover, &.Mui-focused': {
        backgroundColor: palette.background.interactiveItem.hover,
      },
      '&[aria-selected="true"], &[aria-selected="true"].Mui-focused': {
        backgroundColor: palette.background.interactiveItem.active,
      },
    },
  }),
});

export default ChatParticipantPicker;
