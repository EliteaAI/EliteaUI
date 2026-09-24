import { memo, useCallback, useMemo, useState } from 'react';

import { Box, Chip, Typography, useTheme } from '@mui/material';

import { isMcpToolkit } from '@/[fsd]/shared/lib/helpers';
import { useIsMcpVisible } from '@/[fsd]/shared/lib/hooks';
import { Select } from '@/[fsd]/shared/ui';
import { TabGroupButton } from '@/[fsd]/shared/ui/tab-group-button';
import RemoveIcon from '@/assets/remove-icon.svg?react';
import { ChatParticipantType, PUBLIC_PROJECT_ID } from '@/common/constants';
import { getToolIconByType } from '@/common/toolkitUtils';
import { EntityTypeIcon } from '@/components/EntityIcon';
import useParticipants from '@/hooks/chat/useParticipants';

const TABS = {
  AGENTS: 'agents',
  PIPELINES: 'pipelines',
  TOOLKITS: 'toolkits',
  MCPS: 'mcps',
  USERS: 'users',
};

const TAB_LABELS = {
  [TABS.AGENTS]: 'Agents',
  [TABS.PIPELINES]: 'Pipelines',
  [TABS.TOOLKITS]: 'Toolkits',
  [TABS.MCPS]: 'MCPs',
  [TABS.USERS]: 'Users',
};

const ENTITY_TYPE_LABEL = {
  [ChatParticipantType.Applications]: 'Agent',
  [ChatParticipantType.Pipelines]: 'Pipeline',
  [ChatParticipantType.Toolkits]: 'Toolkit',
  mcp: 'MCP',
  [ChatParticipantType.Users]: 'User',
};

const TAB_FETCH_TYPES = {
  [TABS.AGENTS]: [ChatParticipantType.Applications],
  [TABS.PIPELINES]: [ChatParticipantType.Applications],
  [TABS.TOOLKITS]: [ChatParticipantType.Toolkits],
  [TABS.MCPS]: [ChatParticipantType.Toolkits],
  [TABS.USERS]: [ChatParticipantType.Users],
};

const getEntityName = p => {
  if (p.agent_type === 'pipeline') return ChatParticipantType.Pipelines;
  if (p.participantType === ChatParticipantType.Toolkits) {
    return isMcpToolkit(p) ? 'mcp' : ChatParticipantType.Toolkits;
  }
  if (p.participantType === ChatParticipantType.Users) return ChatParticipantType.Users;
  return ChatParticipantType.Applications;
};

const makeKey = p => `${p.entity_name}:${p.project_id}:${p.id}`;

const filterFetchedForTab = (fetched, tab) => {
  switch (tab) {
    case TABS.AGENTS:
      return fetched.filter(
        p => p.participantType === ChatParticipantType.Applications && p.agent_type !== 'pipeline',
      );
    case TABS.PIPELINES:
      return fetched.filter(p => p.agent_type === 'pipeline');
    case TABS.TOOLKITS:
      return fetched.filter(p => p.participantType === ChatParticipantType.Toolkits && !isMcpToolkit(p));
    case TABS.MCPS:
      return fetched.filter(p => p.participantType === ChatParticipantType.Toolkits && isMcpToolkit(p));
    case TABS.USERS:
      return fetched.filter(p => p.participantType === ChatParticipantType.Users);
    default:
      return fetched;
  }
};

// Sentinel value used to render the tab bar as a non-selectable option row
const TAB_ROW_OPTION = '__tab_row__';
const EMPTY_SENTINEL = '__no_results__';

// Styles applied to the tab row's MenuItem: remove disabled appearance and normal item padding
const TAB_ROW_ITEM_STYLE = {
  padding: 0,
  cursor: 'default',
  minHeight: 'auto',
  '&:hover': { backgroundColor: 'transparent' },
  '&.Mui-disabled': { opacity: 1, pointerEvents: 'all' },
};

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

  const { participants: fetched, isFetching } = useParticipants({
    sortBy: 'name',
    sortOrder: 'asc',
    query,
    pageSize: 50,
    types: TAB_FETCH_TYPES[activeTab],
  });

  const fetchedForTab = useMemo(() => filterFetchedForTab(fetched, activeTab), [fetched, activeTab]);

  const allSelectedKeys = useMemo(() => new Set(participants.map(makeKey)), [participants]);

  const resultOptions = useMemo(
    () =>
      fetchedForTab
        .filter(p => {
          const entity_name = getEntityName(p);
          return !allSelectedKeys.has(`${entity_name}:${p.project_id}:${p.id}`);
        })
        .map(p => {
          const entity_name = getEntityName(p);
          return {
            value: `${entity_name}:${p.project_id}:${p.id}`,
            label: p.name,
            entity_name,
            project_id: p.project_id,
            id: p.id,
            agent_type: p.agent_type ?? null,
            // toolkit_type is used to resolve the correct toolkit icon in the dropdown
            toolkit_type: p.type ?? null,
          };
        }),
    [fetchedForTab, allSelectedKeys],
  );

  const handleTabChange = useCallback((_, tab) => {
    setActiveTab(tab);
    setQuery('');
  }, []);

  const handleSelectOption = useCallback(
    key => {
      if (disabled || !key || key === TAB_ROW_OPTION || key === EMPTY_SENTINEL) return;
      const found = resultOptions.find(o => o.value === key);
      if (!found) return;
      onChange([
        ...participants,
        {
          id: found.id,
          name: found.label,
          project_id: found.project_id,
          entity_name: found.entity_name,
          agent_type: found.agent_type,
          toolkit_type: found.toolkit_type ?? null,
        },
      ]);
    },
    [disabled, resultOptions, participants, onChange],
  );

  const handleRemove = useCallback(
    key => {
      if (disabled) return;
      onChange(participants.filter(p => makeKey(p) !== key));
    },
    [disabled, participants, onChange],
  );

  const renderOption = useCallback(
    // eslint-disable-next-line no-unused-vars
    (option, _isSelected) => {
      // Tab bar row rendered as a non-selectable item inside the dropdown
      if (option.value === TAB_ROW_OPTION) {
        return (
          <Box
            sx={styles.tabsRow}
            onClick={e => e.stopPropagation()}
          >
            <TabGroupButton
              arrayBtn={tabItems}
              value={activeTab}
              onChange={handleTabChange}
              variant="elitea"
              disableTooltip
            />
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
      const isToolkitLike =
        option.entity_name === ChatParticipantType.Toolkits || option.entity_name === 'mcp';
      return (
        <Box sx={styles.optionBody}>
          {isToolkitLike ? (
            getToolIconByType(option.toolkit_type ?? '', theme, { isMCP: option.entity_name === 'mcp' })
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
          <Typography
            variant="bodySmall"
            sx={styles.optionTypeLabel}
          >
            {ENTITY_TYPE_LABEL[option.entity_name] ?? ''}
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

  const renderSelectValue = useCallback(
    () => (
      <Typography
        variant="bodyMedium"
        color="text.secondary"
      >
        {`Search ${TAB_LABELS[activeTab].toLowerCase()}...`}
      </Typography>
    ),
    [activeTab],
  );

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
      {/* Selected participants as chips */}
      {participants.length > 0 && (
        <Box sx={styles.chips}>
          {participants.map(p => {
            const key = makeKey(p);
            return (
              <Chip
                key={key}
                label={
                  <Box sx={styles.chipLabel}>
                    {p.entity_name === ChatParticipantType.Toolkits || p.entity_name === 'mcp' ? (
                      p.toolkit_type ? (
                        getToolIconByType(p.toolkit_type, theme, {
                          isMCP: p.entity_name === 'mcp',
                        })
                      ) : (
                        <EntityTypeIcon
                          type="skill"
                          specifiedFontSize="0.875rem"
                        />
                      )
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
                deleteIcon={<RemoveIcon fill={theme.palette.icon.default} />}
                onDelete={disabled ? undefined : () => handleRemove(key)}
                disabled={disabled}
                sx={styles.chip}
              />
            );
          })}
        </Box>
      )}

      {/* Search and type-tabbed participant picker */}
      <Select.SingleSelect
        value=""
        options={displayOptions}
        onValueChange={handleSelectOption}
        withSearch
        searchFilterMode="remote"
        searchString={query}
        onSearch={setQuery}
        isListFetching={isFetching}
        displayEmpty
        showBorder
        showEmptyPlaceholder={false}
        disabled={disabled}
        customRenderValue={renderSelectValue}
        customRenderOption={renderOption}
        searchPlaceholder={`Search ${TAB_LABELS[activeTab].toLowerCase()}...`}
        customMenuProps={menuProps}
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
    height: '1.5rem',
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
    padding: '0.375rem 0.75rem',
  },
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
