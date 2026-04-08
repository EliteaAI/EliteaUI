import { memo, useCallback, useMemo, useRef, useState } from 'react';

import { Box, IconButton, Typography } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import {
  ParticipantCreationPermissionMap,
  ParticipantEntityTypes,
} from '@/[fsd]/features/chat/lib/constants/participant.constants';
import { ChatParticipantType } from '@/common/constants';
import { getChatParticipantUniqueId } from '@/common/utils';
import ParticipantsAccordion from '@/components/ParticipantsAccordion';
import UnifiedDropdown from '@/components/UnifiedDropdown';
import useFetchParticipantDetails from '@/hooks/chat/useFetchParticipantDetails';
import useFilteredEntityItems from '@/hooks/chat/useFilteredEntityItems';
import useCheckPermission from '@/hooks/useCheckPermission';
import useIsSmallWindow from '@/hooks/useIsSmallWindow';
import useToast from '@/hooks/useToast';
import { useTheme } from '@emotion/react';

import ParticipantItem from './ParticipantItem';
import ParticipantsDropdown from './ParticipantsDropdown';

const EMPTY_STATE_LABEL_BY_ENTITY = {
  [ParticipantEntityTypes.Agent]: 'agents',
  [ParticipantEntityTypes.Application]: 'agents',
  [ParticipantEntityTypes.Pipeline]: 'pipelines',
  [ParticipantEntityTypes.Toolkit]: 'toolkits',
  [ParticipantEntityTypes.MCP]: 'MCPs',
};

const getEmptyStateMessage = entityType =>
  `Still no ${EMPTY_STATE_LABEL_BY_ENTITY[entityType] ?? `${entityType}s`} added`;

const ParticipantSection = memo(props => {
  const {
    disabledEdit,
    participants,
    collapsed,
    activeParticipantId,
    onSelectParticipant,
    onDeleteParticipant,
    onUpdateParticipant,
    onEditParticipant,
    onAddParticipants,
    participantType,
    //
    entityItems,
    onCreateEntity,
    isLoading,
    onRefresh,
    entityType,
    CollapsedIcon,
    AddIcon,
    onLoadMore,
    editingToolkit,
    query,
    setQuery,
    selectedManager,
    newConversationSelectedManager,
  } = props;

  const theme = useTheme();

  const { isSmallWindow } = useIsSmallWindow();
  const { toastSuccess } = useToast();
  const { checkPermission } = useCheckPermission();
  const showCreateNew = useMemo(
    () => checkPermission(ParticipantCreationPermissionMap[entityType]),
    [checkPermission, entityType],
  );

  // Local state to control the collapsed trigger tooltip visibility
  const [isCollapsedTooltipOpen, setIsCollapsedTooltipOpen] = useState(false);

  // Search states for dropdowns
  const filteredEntityItems = useFilteredEntityItems(entityItems, participants, participantType, query);
  const { fetchOriginalDetails } = useFetchParticipantDetails();

  // Collapsed per-type dropdown anchors
  const [collapsedAnchor, setAgentCollapsedAnchor] = useState(null);
  const [selectNewItemAnchor, setSelectNewItemAnchor] = useState(null);

  // Search change handlers
  const handleSearchChange = useCallback(
    e => {
      setQuery(e.target.value);
    },
    [setQuery],
  );

  // Selection handlers
  const handleEntitySelect = useCallback(
    async item => {
      if (onAddParticipants) {
        const participantToAdd = {
          participantType,
          ...(item.data || {}),
        };
        const details = await fetchOriginalDetails(
          participantType,
          participantToAdd.id,
          participantToAdd.project_id,
        );
        onAddParticipants([
          {
            ...participantToAdd,
            ...(details || {}),
            entity_name: participantToAdd.participantType,
            entity_meta: { id: participantToAdd.id, project_id: participantToAdd.project_id },
            entity_settings:
              participantType === ChatParticipantType.Toolkits
                ? {
                    icon_meta: details.icon_meta,
                    toolkit_type: details.type,
                  }
                : {
                    agent_type: details.version_details.agent_type,
                    llm_settings: details.version_details.llm_settings,
                    variables: details.version_details.variables,
                    version_id: details.version_details.id,
                  },
            meta: { name: participantToAdd.name, mcp: details.meta?.mcp },
            // Store the original latest version ID for comparison later
            originalLatestVersionId: details.version_details?.id,
          },
        ]);
      }
      setQuery('');
      if (collapsed && !isSmallWindow) {
        const name = item?.label || item?.data?.name || item?.data?.title || entityType;
        toastSuccess(`The ${name} ${entityType} was successfully added to the Participants list.`);
      }
    },
    [
      onAddParticipants,
      collapsed,
      isSmallWindow,
      participantType,
      fetchOriginalDetails,
      entityType,
      toastSuccess,
      setQuery,
    ],
  );

  // Collapsed dropdown handlers
  // Keep a stable ref for the trigger so Popper always anchors correctly
  const collapsedTriggerRef = useRef(null);

  const openEntityCollapsedDropdown = useCallback(() => {
    setAgentCollapsedAnchor(collapsedTriggerRef.current);
  }, []);

  const onCloseDropdown = useCallback(() => {
    if (selectNewItemAnchor) {
      setSelectNewItemAnchor(null);
    } else {
      setAgentCollapsedAnchor(null);
    }
  }, [selectNewItemAnchor]);

  // Collapsed dropdown items with click binding
  const collapsedEntityItems = useMemo(
    () =>
      filteredEntityItems.map(item => ({
        ...item,
        onClick: () => {
          handleEntitySelect(item);
          onCloseDropdown();
        },
      })),
    [filteredEntityItems, handleEntitySelect, onCloseDropdown],
  );

  const onAddNewParticipant = useCallback(event => {
    setSelectNewItemAnchor(event.currentTarget);
  }, []);

  const onCloseSelectNewDropdown = useCallback(() => {
    setSelectNewItemAnchor(null);
  }, []);

  // When any dropdown is open, suppress trigger tooltip
  const isAnyDropdownOpen = Boolean(collapsedAnchor || selectNewItemAnchor);

  const onTriggerTooltipOpen = useCallback(() => {
    if (!isAnyDropdownOpen) setIsCollapsedTooltipOpen(true);
  }, [isAnyDropdownOpen]);

  const onTriggerTooltipClose = useCallback(() => {
    setIsCollapsedTooltipOpen(false);
  }, []);

  const onCollapsedTriggerClick = useCallback(() => {
    setIsCollapsedTooltipOpen(false);
    openEntityCollapsedDropdown();
  }, [openEntityCollapsedDropdown]);
  // Remove accidental duplicate handlers (use onTriggerTooltipOpen/Close above)

  return (
    <Box sx={styles.mainContainer(collapsed, isSmallWindow)}>
      {/* Collapsed View - Four per-type icons, no selected items */}
      {collapsed && !isSmallWindow ? (
        <>
          <StyledTooltip
            title={`Add ${entityType}`}
            placement="right"
            disableInteractive
            disableHoverListener={false}
            disableFocusListener={false}
            disableTouchListener={false}
            open={isCollapsedTooltipOpen && !isAnyDropdownOpen}
            onOpen={onTriggerTooltipOpen}
            onClose={onTriggerTooltipClose}
          >
            <IconButton
              ref={collapsedTriggerRef}
              variant="elitea"
              color="secondary"
              onClick={onCollapsedTriggerClick}
              sx={styles.collapsedTriggerButton}
            >
              <CollapsedIcon
                sx={styles.collapsedIcon}
                fill={theme.palette.icon.fill.default}
              />
            </IconButton>
          </StyledTooltip>
          <ParticipantsDropdown
            anchorEl={collapsedAnchor}
            open={Boolean(collapsedAnchor)}
            onClose={onCloseDropdown}
            participants={participants}
            onAddNew={onAddNewParticipant}
            showDivider={true}
            // When true, the dropdown opens to the left of the anchor (for collapsed rail)
            preferLeft
            preferTopAlign
            disabledEdit={disabledEdit}
            onSelectParticipant={onSelectParticipant}
            activeParticipantId={activeParticipantId}
            onDeleteParticipant={onDeleteParticipant}
            onUpdateParticipant={onUpdateParticipant}
            onEditParticipant={onEditParticipant}
            entityType={entityType}
            AddIcon={AddIcon}
            editingToolkit={editingToolkit}
          />
          <UnifiedDropdown
            anchorEl={selectNewItemAnchor}
            open={Boolean(selectNewItemAnchor)}
            onClose={onCloseSelectNewDropdown}
            items={collapsedEntityItems}
            searchValue={query}
            onSearchChange={handleSearchChange}
            searchPlaceholder={`Search ${entityType}s...`}
            onCreateNew={onCreateEntity}
            createNewLabel={`Create new ${entityType}`}
            showCreateNew={showCreateNew}
            autoFocus={true}
            preferLeft
            sx={styles.unifiedDropdown} // Ensure dropdown doesn't overlap with other icons
            onScroll={onLoadMore}
            showPublicLabel
          />
        </>
      ) : (
        /* Expanded View - Accordion Layout */
        <ParticipantsAccordion
          title={`${entityType.toLowerCase() !== 'mcp' ? entityType : 'MCP'}s`}
          collapsed={false}
          showDropdown={true}
          addIcon={AddIcon}
          dropdownItems={filteredEntityItems}
          onDropdownItemSelect={handleEntitySelect}
          searchValue={query}
          onSearchChange={handleSearchChange}
          searchPlaceholder={`Search ${entityType}s...`}
          onCreateNew={onCreateEntity}
          createNewLabel={`Create new ${entityType}`}
          showCreateNew={showCreateNew}
          isDropdownLoading={isLoading}
          emptyMessage={`No ${entityType}s available`}
          noResultsMessage={`No ${entityType}s found`}
          addTooltip={`Add ${entityType}`}
          disabledAdd={false}
          defaultExpanded={true}
          onRefresh={onRefresh}
          onLoadMore={onLoadMore}
        >
          {participants.length === 0 ? (
            <Typography
              variant="bodyMedium"
              sx={styles.emptyStateMessage}
            >
              {getEmptyStateMessage(entityType)}
            </Typography>
          ) : (
            <Box sx={styles.participantItemsContainer}>
              {participants.map((participant, index) => (
                <ParticipantItem
                  disabledEdit={disabledEdit}
                  onClickItem={onSelectParticipant}
                  key={participant.id || participant.name + index}
                  collapsed={false}
                  participant={participant}
                  isActive={activeParticipantId === getChatParticipantUniqueId(participant)}
                  onDelete={onDeleteParticipant}
                  onEdit={onEditParticipant}
                  onUpdateParticipant={onUpdateParticipant}
                  editingToolkit={editingToolkit}
                  isAttachement={
                    (newConversationSelectedManager || selectedManager) === participant.entity_meta?.id
                  }
                />
              ))}
            </Box>
          )}
        </ParticipantsAccordion>
      )}
    </Box>
  );
});

ParticipantSection.displayName = 'ParticipantSection';

/** @type MuiSx ./ParticipantSection.jsx */
const styles = {
  mainContainer: (collapsed, isSmallWindow) => ({
    gap: '8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: !collapsed || isSmallWindow ? 'flex-start' : 'center',
    msOverflowStyle: 'none',
    scrollbarWidth: 'none',
    '::-webkit-scrollbar': {
      display: 'none',
    },
    height: 'auto',
    paddingTop: !collapsed || isSmallWindow ? '0px' : '8px',
    width: '100%',
  }),
  collapsedTriggerButton: ({ palette }) => ({
    padding: '6px',
    backgroundColor: palette.background.button?.secondary || 'rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    '&:hover': {
      backgroundColor: palette.background.button?.secondaryHover || 'rgba(255, 255, 255, 0.15)',
    },
    '& .MuiSvgIcon-root path': {
      fill: `${palette.icon.fill.default} !important`,
    },
    color: `${palette.icon.fill.default} !important`,
  }),
  collapsedIcon: {
    fontSize: '16px',
    color: ({ palette }) => palette.icon.fill.default,
  },
  unifiedDropdown: {
    margin: '0 -14px 0 0 !important',
  },
  participantItemsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  emptyStateMessage: ({ palette }) => ({
    color: palette.text.participant.default,
  }),
};

export default ParticipantSection;
