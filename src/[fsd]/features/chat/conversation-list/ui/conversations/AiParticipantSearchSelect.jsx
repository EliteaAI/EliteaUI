import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { CircularProgress, Typography, useTheme } from '@mui/material';
import { createFilterOptions } from '@mui/material/Autocomplete';
import { Box } from '@mui/system';

import AutoCompleteDropDown from '@/ComponentsLib/AutoCompleteDropDown';
import { ChatParticipantType, PUBLIC_PROJECT_ID } from '@/common/constants';
import { EntityTypeIcon } from '@/components/EntityIcon';
import SearchIcon from '@/components/Icons/SearchIcon';
import useParticipants from '@/hooks/chat/useParticipants';

const LOADING_SENTINEL_KEY = '__ai_participants_loading__';

const defaultFilter = createFilterOptions();

const isLoadingOption = option => !!option.isLoadingMore;

const AiParticipantSearchSelect = memo(props => {
  const {
    selectedParticipants,
    onChangeParticipants,
    disabled,
    slotProps = { listBox: {} },
    ...restProps
  } = props;

  const theme = useTheme();
  const styles = useMemo(() => aiParticipantSearchSelectStyles(), []);
  const [query, setQuery] = useState('');

  const { participants, isFetching, onLoadMore, total } = useParticipants({
    sortBy: 'name',
    sortOrder: 'asc',
    query,
    pageSize: 50,
    types: [ChatParticipantType.Applications, ChatParticipantType.Pipelines],
  });

  const hasMore = total > participants.length;
  const listboxScrollRef = useRef({ node: null, scrollTop: 0 });

  const handleListboxScroll = useCallback(
    event => {
      const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
      listboxScrollRef.current = { node: event.currentTarget, scrollTop };
      if (!hasMore || isFetching) return;
      if (scrollHeight - scrollTop - clientHeight < 100) {
        onLoadMore();
      }
    },
    [hasMore, isFetching, onLoadMore],
  );

  const mergedListboxSlotProps = useMemo(
    () => ({
      ...slotProps.listBox,
      onScroll: event => {
        slotProps.listBox?.onScroll?.(event);
        handleListboxScroll(event);
      },
    }),
    [slotProps.listBox, handleListboxScroll],
  );

  const getEntityName = useCallback(
    p => (p.agent_type === 'pipeline' ? ChatParticipantType.Pipelines : ChatParticipantType.Applications),
    [],
  );

  const getUniqueKey = useCallback(
    p => `${p.entity_name ?? getEntityName(p)}:${p.project_id}:${p.id}`,
    [getEntityName],
  );

  const enrichedSelectedParticipants = useMemo(
    () => selectedParticipants.map(p => ({ ...p, uniqueKey: getUniqueKey(p) })),
    [selectedParticipants, getUniqueKey],
  );

  const selectedUniqueKeys = useMemo(
    () => new Set(enrichedSelectedParticipants.map(p => p.uniqueKey)),
    [enrichedSelectedParticipants],
  );

  const optionList = useMemo(() => {
    const fromApi = participants
      .filter(p => !selectedUniqueKeys.has(`${getEntityName(p)}:${p.project_id}:${p.id}`))
      .map(p => {
        const entity_name = getEntityName(p);
        return {
          id: p.id,
          name: p.name || '',
          project_id: p.project_id,
          entity_name,
          agent_type: p.agent_type,
          uniqueKey: `${entity_name}:${p.project_id}:${p.id}`,
        };
      });
    // Always include currently selected items so AutoCompleteDropDown's internal
    // validation (canInputNewValues=false) doesn't strip them on chip removal.
    const base = [...enrichedSelectedParticipants, ...fromApi];
    if (isFetching) {
      base.push({ uniqueKey: LOADING_SENTINEL_KEY, name: '', isLoadingMore: true });
    }
    return base;
  }, [participants, selectedUniqueKeys, enrichedSelectedParticipants, getEntityName, isFetching]);

  const filterOptionsWithSentinel = useCallback((options, state) => {
    const sentinel = options.find(o => o.isLoadingMore);
    const regular = options.filter(o => !o.isLoadingMore);
    const filtered = defaultFilter(regular, state);
    return sentinel ? [...filtered, sentinel] : filtered;
  }, []);

  useEffect(() => {
    const { node, scrollTop } = listboxScrollRef.current;
    if (node?.isConnected && node.scrollTop !== scrollTop) {
      node.scrollTop = scrollTop;
    }
  }, [optionList]);

  const handleInputChange = useCallback(
    (_event, newInputValue) => {
      if (newInputValue === query) return;
      listboxScrollRef.current = { node: null, scrollTop: 0 };
      setQuery(newInputValue);
    },
    [query],
  );

  const renderOptionBody = useCallback(
    option => {
      if (option.isLoadingMore) {
        return (
          <Box sx={styles.loadingOption}>
            <CircularProgress size={16} />
          </Box>
        );
      }
      const isPublic = option.project_id === PUBLIC_PROJECT_ID;
      return (
        <Box sx={styles.optionBody}>
          <EntityTypeIcon
            type={option.entity_name}
            specifiedFontSize="1rem"
          />
          <Typography
            variant="bodyMedium"
            color="text.secondary"
            sx={styles.optionName}
          >
            {option.name}
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
    [styles],
  );

  const renderChipLabel = useCallback(
    option => {
      const isPublic = option.project_id === PUBLIC_PROJECT_ID;
      return (
        <Box sx={styles.chipLabel}>
          <EntityTypeIcon
            type={option.entity_name}
            specifiedFontSize="0.75rem"
          />
          <Typography
            variant="bodySmall"
            color="text.secondary"
          >
            {option.name}
          </Typography>
          {isPublic && (
            <Box sx={styles.chipPublicBadge}>
              <Typography
                variant="bodySmall"
                sx={styles.chipPublicText}
              >
                Public
              </Typography>
            </Box>
          )}
        </Box>
      );
    },
    [styles],
  );

  return (
    <AutoCompleteDropDown
      optionList={optionList}
      selectedOptions={enrichedSelectedParticipants}
      onChangedSelectedOptions={onChangeParticipants}
      idField="uniqueKey"
      disabled={disabled}
      label=""
      placeholder="Search AI participants..."
      nameField="name"
      canInputNewValues={false}
      useInitialValue={false}
      ignoreCase={false}
      renderOptionBody={renderOptionBody}
      renderChipLabel={renderChipLabel}
      filterOptions={filterOptionsWithSentinel}
      getOptionDisabled={isLoadingOption}
      onInputChange={handleInputChange}
      slotProps={{
        listbox: mergedListboxSlotProps,
      }}
      showSearchIcon
      slots={{
        SearchIcon: (
          <SearchIcon
            width={16}
            height={16}
            fill={theme.palette.icon.default}
          />
        ),
      }}
      {...restProps}
    />
  );
});

AiParticipantSearchSelect.displayName = 'AiParticipantSearchSelect';

/** @type {MuiSx} */
const aiParticipantSearchSelectStyles = () => ({
  loadingOption: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    padding: '0.25rem 0',
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
    marginRight: '1rem',
    'li[aria-selected="true"] &': {
      border: `0.0625rem solid ${palette.border.hover}`,
    },
  }),
  publicBadgeText: {
    color: ({ palette }) => palette.text.metrics,
  },
  chipLabel: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'row',
    gap: '0.25rem',
  },
  chipPublicBadge: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: '0.125rem 0.375rem',
    height: '1.25rem',
    borderRadius: '0.875rem',
    border: ({ palette }) => `0.0625rem solid ${palette.border.lines}`,
    flexShrink: 0,
  },
  chipPublicText: {
    color: ({ palette }) => palette.text.metrics,
  },
});

export default AiParticipantSearchSelect;
