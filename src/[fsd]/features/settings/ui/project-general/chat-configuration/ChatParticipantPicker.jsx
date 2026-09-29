import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Box, Chip, Typography, useTheme } from '@mui/material';

import { getChatParticipantUniqueId } from '@/[fsd]/features/chat/participants/lib/helpers';
import { ChatParticipantConstants } from '@/[fsd]/features/settings/lib/constants';
import { ChatParticipantHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { isMcpToolkitType } from '@/[fsd]/shared/lib/helpers';
import { useIsMcpVisible } from '@/[fsd]/shared/lib/hooks';
import { Select } from '@/[fsd]/shared/ui';
import RemoveIcon from '@/assets/remove-icon.svg?react';
import { ChatParticipantType, PUBLIC_PROJECT_ID } from '@/common/constants';
import { getToolIconByType } from '@/common/toolkitUtils';
import { EntityTypeIcon } from '@/components/EntityIcon';
import UserAvatar from '@/components/UserAvatar';
import useParticipants from '@/hooks/chat/useParticipants';

const {
  TABS,
  TAB_LABELS,
  ENTITY_TYPE_LABEL,
  TAB_ENTITY_TYPE,
  TAB_FETCH_TYPES,
  TAB_ROW_OPTION,
  EMPTY_SENTINEL,
  TAB_ROW_ITEM_STYLE,
} = ChatParticipantConstants;

const { getEntityName, filterFetchedForTab } = ChatParticipantHelpers;

// Picker participants use flat `id`/`project_id` rather than `entity_meta`; adapt to the shared helper.
const makeParticipantKey = p =>
  getChatParticipantUniqueId({
    entity_name: p.entity_name,
    entity_meta: { id: p.id, project_id: p.project_id },
  });

const ChatParticipantPicker = memo(props => {
  const { participants = [], onChange, isTeamProject = false, disabled = false } = props;

  const theme = useTheme();
  const styles = chatParticipantPickerStyles();
  const isMcpVisible = useIsMcpVisible();

  const [activeTab, setActiveTab] = useState(TABS.AGENTS);
  const [query, setQuery] = useState('');

  const visibleTabs = useMemo(
    () =>
      Object.values(TABS).filter(tab => {
        if (tab === TABS.MCPS && !isMcpVisible) return false;
        if (tab === TABS.USERS && !isTeamProject) return false;
        return true;
      }),
    [isMcpVisible, isTeamProject],
  );

  const tabItems = useMemo(
    () => visibleTabs.map(tab => ({ value: tab, label: TAB_LABELS[tab] })),
    [visibleTabs],
  );

  const {
    participants: fetched,
    isFetching,
    onLoadMore,
  } = useParticipants({
    sortBy: 'name',
    sortOrder: 'asc',
    query,
    pageSize: 50,
    types: TAB_FETCH_TYPES[activeTab],
  });

  // Prevents calling onLoadMore repeatedly before the in-flight fetch resolves.
  // The ref is reset once isFetching goes back to false.
  const loadMoreInFlightRef = useRef(false);

  useEffect(() => {
    if (!isFetching) {
      loadMoreInFlightRef.current = false;
    }
  }, [isFetching]);

  // When the tab or search query changes the list resets to page 0; unblock the ref
  // so the first bottom-scroll on the new list can trigger a load.
  useEffect(() => {
    loadMoreInFlightRef.current = false;
  }, [activeTab, query]);

  const handleMenuScroll = useCallback(
    event => {
      if (loadMoreInFlightRef.current || isFetching) return;
      const el = event.currentTarget;
      if (el.scrollHeight > el.clientHeight && el.scrollTop + el.clientHeight >= el.scrollHeight - 80) {
        loadMoreInFlightRef.current = true;
        onLoadMore();
      }
    },
    [isFetching, onLoadMore],
  );

  const fetchedForTab = useMemo(() => filterFetchedForTab(fetched, activeTab), [fetched, activeTab]);

  const resultOptions = useMemo(
    () =>
      fetchedForTab.map(p => {
        const entity_name = getEntityName(p);
        const option = {
          label: p.name,
          entity_name,
          project_id: p.project_id,
          id: p.id,
          agent_type: p.agent_type ?? null,
          // toolkit_type is used to resolve the correct toolkit icon in the dropdown
          toolkit_type: p.type ?? null,
          avatar: p.avatar ?? null,
        };
        return { ...option, value: makeParticipantKey(option) };
      }),
    [fetchedForTab],
  );

  const handleTabChange = useCallback((_, tab) => {
    setActiveTab(tab);
    setQuery('');
  }, []);

  // In multiple mode SingleSelect passes the full new selected-keys array to onValueChange.
  // We map each key back to a participant object, preserving data for items not in current
  // resultOptions (e.g. selected participants from a different tab or search context).
  const handleSelectOption = useCallback(
    newKeys => {
      if (disabled) return;
      const validKeys = (Array.isArray(newKeys) ? newKeys : [newKeys]).filter(
        k => k && k !== TAB_ROW_OPTION && k !== EMPTY_SENTINEL,
      );
      const existingByKey = new Map(participants.map(p => [makeParticipantKey(p), p]));
      const newParticipants = validKeys
        .map(key => {
          if (existingByKey.has(key)) return existingByKey.get(key);
          const found = resultOptions.find(o => o.value === key);
          if (!found) return null;
          return {
            id: found.id,
            name: found.label,
            project_id: found.project_id,
            entity_name: found.entity_name,
            agent_type: found.agent_type,
            toolkit_type: found.toolkit_type ?? null,
            avatar: found.avatar ?? null,
          };
        })
        .filter(Boolean);
      onChange(newParticipants);
    },
    [disabled, participants, resultOptions, onChange],
  );

  const handleRemove = useCallback(
    key => {
      if (disabled) return;
      onChange(participants.filter(p => makeParticipantKey(p) !== key));
    },
    [disabled, participants, onChange],
  );

  const renderOption = useCallback(
    // eslint-disable-next-line no-unused-vars
    (option, _isSelected) => {
      // Tab filter chips rendered as a non-selectable row inside the dropdown
      if (option.value === TAB_ROW_OPTION) {
        return (
          <Box
            sx={styles.tabsRow}
            onClick={e => e.stopPropagation()}
          >
            {tabItems.map(tab => (
              <Chip
                key={tab.value}
                icon={
                  tab.value === TABS.TOOLKITS || tab.value === TABS.MCPS ? (
                    getToolIconByType('', theme, { isMCP: tab.value === TABS.MCPS })
                  ) : (
                    <EntityTypeIcon
                      type={TAB_ENTITY_TYPE[tab.value]}
                      specifiedFontSize="0.875rem"
                      specifiedFill={
                        activeTab === tab.value
                          ? theme.palette.components.chip.text.active
                          : theme.palette.components.chip.text.default
                      }
                    />
                  )
                }
                label={
                  <Typography
                    variant="labelSmall"
                    color="inherit"
                  >
                    {tab.label}
                  </Typography>
                }
                onClick={() => handleTabChange(null, tab.value)}
                onMouseDown={e => e.stopPropagation()}
                sx={styles.tabChip(activeTab === tab.value)}
              />
            ))}
          </Box>
        );
      }

      // Empty / no-results row
      if (option.value === EMPTY_SENTINEL) {
        return (
          <Typography
            variant="bodySmall"
            color="text.secondary"
          >
            {option.label}
          </Typography>
        );
      }

      // Regular participant option
      const isPublic = option.project_id === PUBLIC_PROJECT_ID;
      const isToolkitLike = option.entity_name === ChatParticipantType.Toolkits;
      return (
        <Box sx={styles.optionBody}>
          {isToolkitLike ? (
            getToolIconByType(option.toolkit_type ?? '', theme, {
              isMCP: isMcpToolkitType(option.toolkit_type),
            })
          ) : option.entity_name === ChatParticipantType.Users && option.avatar ? (
            <UserAvatar
              avatar={option.avatar}
              name={option.label}
              size={16}
            />
          ) : (
            <EntityTypeIcon
              type={option.entity_name}
              specifiedFontSize="1rem"
            />
          )}
          <Typography
            variant="bodyMedium"
            color="text.secondary"
            sx={styles.optionName}
          >
            {option.label}
          </Typography>
          {isPublic && (
            <Box sx={styles.publicBadge}>
              <Typography
                variant="bodySmall"
                sx={styles.publicBadgeText}
              >
                Public
              </Typography>
            </Box>
          )}
          <Typography
            variant="bodySmall"
            sx={styles.optionTypeLabel}
          >
            {ENTITY_TYPE_LABEL[option.entity_name] ?? ''}
          </Typography>
        </Box>
      );
    },
    [styles, tabItems, activeTab, handleTabChange, theme],
  );

  // Tab bar is injected as the first option so it appears right below the search bar
  const displayOptions = useMemo(() => {
    const tabRowOption = {
      value: TAB_ROW_OPTION,
      label: '',
      disabled: true,
      style: TAB_ROW_ITEM_STYLE,
    };

    if (resultOptions.length > 0 || isFetching) {
      return [tabRowOption, ...resultOptions];
    }

    const emptyLabel = query
      ? `No ${TAB_LABELS[activeTab].toLowerCase()} match "${query}".`
      : `No ${TAB_LABELS[activeTab].toLowerCase()} available.`;

    return [tabRowOption, { value: EMPTY_SENTINEL, label: emptyLabel, disabled: true }];
  }, [resultOptions, isFetching, query, activeTab]);

  const renderSelectValue = useCallback(() => {
    if (participants.length === 0) {
      return (
        <Typography
          variant="bodyMedium"
          color="text.secondary"
        >
          {`Search ${TAB_LABELS[activeTab].toLowerCase()}...`}
        </Typography>
      );
    }

    return (
      <Box sx={styles.chips}>
        {participants.map(p => {
          const key = makeParticipantKey(p);
          return (
            <Chip
              key={key}
              label={
                <Box sx={styles.chipLabel}>
                  {p.entity_name === ChatParticipantType.Toolkits ? (
                    p.toolkit_type ? (
                      getToolIconByType(p.toolkit_type, theme, {
                        isMCP: isMcpToolkitType(p.toolkit_type),
                      })
                    ) : (
                      <EntityTypeIcon
                        type="skill"
                        specifiedFontSize="0.875rem"
                      />
                    )
                  ) : p.entity_name === ChatParticipantType.Users && p.avatar ? (
                    <UserAvatar
                      avatar={p.avatar}
                      name={p.name}
                      size={14}
                    />
                  ) : (
                    <EntityTypeIcon
                      type={p.entity_name}
                      specifiedFontSize="0.875rem"
                    />
                  )}
                  <Typography
                    variant="bodySmall"
                    color="text.secondary"
                  >
                    {p.name}
                  </Typography>
                </Box>
              }
              deleteIcon={
                <RemoveIcon
                  fill={theme.palette.icon.default}
                  onMouseDown={e => e.stopPropagation()}
                />
              }
              onDelete={disabled ? undefined : () => handleRemove(key)}
              disabled={disabled}
              sx={styles.chip}
            />
          );
        })}
      </Box>
    );
  }, [participants, activeTab, theme, disabled, handleRemove, styles]);

  const menuProps = useMemo(
    () => ({
      PaperProps: {
        sx: ({ palette }) => ({
          backgroundColor: palette.background.default.secondary,
        }),
      },
    }),
    [],
  );

  return (
    <Box sx={styles.root}>
      {/* Search and type-tabbed participant picker; selected participants render as chips inside the Select's value */}
      <Select.SingleSelect
        value={participants.map(makeParticipantKey)}
        options={displayOptions}
        onValueChange={handleSelectOption}
        withSearch
        searchFilterMode="remote"
        searchString={query}
        onSearch={setQuery}
        isListFetching={isFetching}
        displayEmpty
        showBorder
        multiple
        showEmptyPlaceholder={false}
        disabled={disabled}
        customRenderValue={renderSelectValue}
        customRenderOption={renderOption}
        searchPlaceholder={`Search ${TAB_LABELS[activeTab].toLowerCase()}...`}
        customMenuProps={menuProps}
        onScroll={handleMenuScroll}
        sx={styles.select}
      />
    </Box>
  );
});

ChatParticipantPicker.displayName = 'ChatParticipantPicker';

/** @type {MuiSx} */
const chatParticipantPickerStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.375rem',
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
  select: {
    width: '100%',
  },
  tabsRow: {
    width: '100%',
    padding: '0.5rem 0.5rem',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  tabChip:
    isActive =>
    ({ palette }) => ({
      height: '1.75rem',
      padding: '0.5rem',
      cursor: 'pointer',
      backgroundColor: isActive
        ? palette.components.chip.background.selected
        : palette.components.chip.background.default,
      color: isActive ? palette.components.chip.text.active : palette.components.chip.text.default,
      border: `0.0625rem solid ${isActive ? palette.components.chip.border.active : palette.components.chip.border.default}`,
      '& .MuiChip-icon': {
        fontSize: '0.875rem',
        marginLeft: '0.375rem',
        marginRight: '-0.125rem',
        color: `${isActive ? palette.components.chip.text.active : palette.components.chip.text.default} !important`,
        '& svg, & svg path': { fill: 'currentColor' },
      },
      '& .MuiChip-label': {
        paddingLeft: '0.375rem',
        paddingRight: '0.5rem',
      },
      '&:hover': {
        backgroundColor: isActive
          ? palette.components.chip.background.selected
          : palette.components.chip.background.default,
      },
    }),
  optionBody: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flex: 1,
    minWidth: 0,
  },
  optionName: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  optionTypeLabel: {
    flexShrink: 0,
    color: ({ palette }) => palette.text.muted,
  },
  publicBadge: ({ palette }) => ({
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: '0.125rem 0.375rem',
    height: '1.25rem',
    borderRadius: '0.875rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    flexShrink: 0,
    'li[aria-selected="true"] &': {
      border: `0.0625rem solid ${palette.border.hover}`,
    },
  }),
  publicBadgeText: {
    color: ({ palette }) => palette.text.metrics,
  },
});

export default ChatParticipantPicker;
