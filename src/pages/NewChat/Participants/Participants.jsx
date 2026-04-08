import { memo, useCallback, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';

import { Box, Button, IconButton, Typography } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { ParticipantEntityTypes } from '@/[fsd]/features/chat/lib/constants/participant.constants';
import { ContextBudgetUI } from '@/[fsd]/widgets/ContextBudget';
import AddAgentIcon from '@/assets/add-agent-icon.svg?react';
import AddMCPIcon from '@/assets/add-mcp-icon.svg?react';
import AddPipelineIcon from '@/assets/add-pipeline-icon.svg?react';
import AddToolIcon from '@/assets/add-tool-icon.svg?react';
import AddUserIcon from '@/assets/add-user-icon.svg?react';
import FlowIcon from '@/assets/flow-icon.svg?react';
import MCPIcon from '@/assets/mcp-icon.svg?react';
import { ChatParticipantType } from '@/common/constants';
import ApplicationsIcon from '@/components/Icons/ApplicationsIcon';
import ClearIcon from '@/components/Icons/ClearIcon';
import DoubleLeftIcon from '@/components/Icons/DoubleLeftIcon';
import DoubleRightIcon from '@/components/Icons/DoubleRightIcon';
import ToolIcon from '@/components/Icons/ToolIcon';
import ParticipantsAccordion from '@/components/ParticipantsAccordion';
import { useDropdownData } from '@/hooks/useDropdownData.jsx';
import useGetComponentWidth from '@/hooks/useGetComponentWidth';
import useIsSmallWindow from '@/hooks/useIsSmallWindow';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import { getBasename } from '@/routes';
import { useTheme } from '@emotion/react';

import UsersDropdown from '../UsersDropdown';
// no plus overlay needed for header add icons
import ParticipantSection from './ParticipantSection';
import UserParticipantItem from './UserParticipantItem';

const Participants = memo(props => {
  const {
    disabledEdit,
    participants,
    collapsed,
    onCollapsed,
    activeParticipantId,
    onSelectParticipant,
    onDeleteParticipant,
    onUpdateParticipant,
    onEditParticipant,
    onAddUsers,
    onAddParticipants,
    disabledAdd,
    disabledClear,
    onClearChatHistory,
    hideClearChatButton = false,
    editingToolkit,
    conversationId,
    onShowAgentCreator,
    onShowToolkitCreator,
    onShowPipelineCreator,
    contextStrategy,
    setActiveConversation,
    conversationInstructions,
    persona,
    selectedManager,
    newConversationSelectedManager,
  } = props;
  const { isSmallWindow } = useIsSmallWindow();
  const user = useSelector(state => state.user);
  const selectedProjectId = useSelectedProjectId();
  const isPrivateProject = selectedProjectId == user.personal_project_id;
  const theme = useTheme();
  const [agentQuery, setAgentQuery] = useState('');

  const [pipelineQuery, setPipelineQuery] = useState('');

  const [toolkitQuery, setToolkitQuery] = useState('');

  const [mcpQuery, setMcpQuery] = useState('');
  const [isUsersSectionHovered, setIsUsersSectionHovered] = useState(false);
  // Get dropdown data
  const {
    agentMenuItems,
    isAgentsLoading,
    pipelineMenuItems,
    isPipelinesLoading,
    toolkitMenuItems,
    isToolkitsLoading,
    mcpMenuItems,
    isMCPsLoading,
    refreshAgents,
    refreshPipelines,
    refreshToolkits,
    refreshMCPs,
    onLoadMoreAgents,
    onLoadMorePipelines,
    onLoadMoreToolkits,
    onLoadMoreMCPs,
  } = useDropdownData({
    agentQuery,
    pipelineQuery,
    toolkitQuery,
    mcpQuery,
  });

  const agentParticipants = useMemo(
    () =>
      participants
        .filter(
          participant =>
            (participant.entity_name === ChatParticipantType.Applications ||
              participant.entity_name === ChatParticipantType.Prompts ||
              participant.entity_name === ChatParticipantType.Datasources) &&
            participant.entity_settings?.agent_type !== 'pipeline' &&
            participant.agent_type !== 'pipeline',
        )
        .sort(),
    [participants],
  );

  const pipelineParticipants = useMemo(
    () =>
      participants
        .filter(
          participant =>
            (participant.entity_name === ChatParticipantType.Pipelines ||
              participant.entity_name === ChatParticipantType.Applications) &&
            (participant.entity_settings?.agent_type === 'pipeline' || participant.agent_type === 'pipeline'),
        )
        .sort(),
    [participants],
  );

  const toolkitParticipants = useMemo(
    () =>
      participants
        .filter(
          participant =>
            participant.entity_name === ChatParticipantType.Toolkits &&
            !participant.meta?.mcp &&
            participant.entity_settings.toolkit_type !== 'mcp',
        )
        .sort(),
    [participants],
  );

  const mcpParticipants = useMemo(
    () =>
      participants
        .filter(
          participant =>
            participant.entity_name === ChatParticipantType.Toolkits &&
            (participant.meta?.mcp || participant.entity_settings?.toolkit_type === 'mcp'),
        )
        .sort(),
    [participants],
  );

  const users = useMemo(
    () =>
      participants
        .filter(participant => participant.entity_name === ChatParticipantType.Users)
        .sort((a, b) => a.id - b.id),
    [participants],
  );
  const { componentRef, componentWidth } = useGetComponentWidth();

  const usersToDisplay = useMemo(() => {
    if (users.length === 0)
      return [
        {
          id: user.id,
          meta: {
            user_name: user.name,
            user_avatar: user.avatar,
          },
        },
      ];
    if (componentWidth <= 200) {
      return users.slice(0, 3);
    }
    return users.slice(0, 5);
  }, [users, user.id, user.name, user.avatar, componentWidth]);

  const createNewEntity = useCallback(
    type => () => {
      if (type === ParticipantEntityTypes.Agent && onShowAgentCreator) {
        // Use the in-chat editor for creating new agents
        onShowAgentCreator();
      } else if (type === ParticipantEntityTypes.Pipeline && onShowPipelineCreator) {
        // Use the in-chat editor for creating new pipelines
        onShowPipelineCreator();
      } else if (
        (type === ParticipantEntityTypes.Toolkit || type === ParticipantEntityTypes.MCP) &&
        onShowToolkitCreator
      ) {
        // Use the in-chat editor for creating new toolkits or mcps
        onShowToolkitCreator(type === ParticipantEntityTypes.MCP);
      } else {
        // Fallback to opening in new tab for other entity types or if creator is not available
        const baseUrl = `${window.location.protocol}//${window.location.host}`;
        const basename = getBasename();
        switch (type) {
          case ParticipantEntityTypes.Agent:
            window.open(`${baseUrl}${basename}/agents/create?viewMode=owner`, '_blank');
            break;
          case ParticipantEntityTypes.Toolkit:
            window.open(`${baseUrl}${basename}/toolkits/create?viewMode=owner`, '_blank');
            break;
          case ParticipantEntityTypes.MCP:
            window.open(`${baseUrl}${basename}/mcps/create?viewMode=owner`, '_blank');
            break;
          case ParticipantEntityTypes.Pipeline:
            window.open(`${baseUrl}${basename}/pipelines/create?viewMode=owner`, '_blank');
            break;
          default:
            break;
        }
      }
    },
    [onShowAgentCreator, onShowToolkitCreator, onShowPipelineCreator],
  );

  // Collapsed Users icon tooltip/menu control state
  const [isUsersTooltipOpen, setIsUsersTooltipOpen] = useState(false);
  const [isUsersMenuOpen, setIsUsersMenuOpen] = useState(false);
  const onUsersTooltipOpen = useCallback(() => {
    if (!isUsersMenuOpen) setIsUsersTooltipOpen(true);
  }, [isUsersMenuOpen]);
  const onUsersTooltipClose = useCallback(() => setIsUsersTooltipOpen(false), []);
  const onUsersMenuOpenChange = useCallback(open => {
    setIsUsersMenuOpen(open);
    if (open) setIsUsersTooltipOpen(false);
  }, []);

  return (
    <Box
      ref={componentRef}
      sx={styles.mainContainer(collapsed)}
    >
      <Box sx={styles.contentContainer(hideClearChatButton, collapsed, isSmallWindow)}>
        <Box sx={styles.headerContainer(collapsed, isSmallWindow)}>
          {(!collapsed || isSmallWindow) && (
            <Box sx={styles.titleContainer}>
              <Typography variant="subtitle">Participants</Typography>
            </Box>
          )}
          {!isSmallWindow && (
            <IconButton
              sx={styles.collapseButton}
              variant="elitea"
              color="tertiary"
              onClick={onCollapsed}
            >
              {collapsed ? (
                <DoubleLeftIcon
                  fill={theme.palette.icon.fill.default}
                  width={16}
                />
              ) : (
                <DoubleRightIcon
                  fill={theme.palette.icon.fill.default}
                  width={16}
                />
              )}
            </IconButton>
          )}
        </Box>
        <Box sx={styles.participantsContainer(collapsed, isSmallWindow)}>
          {/* Collapsed View - Four per-type icons, no selected items */}
          {collapsed && !isSmallWindow ? (
            <>
              {/* Users (hidden in private project) */}
              {!isPrivateProject && (
                <StyledTooltip
                  title="Add Users"
                  placement="right"
                  open={isUsersTooltipOpen && !isUsersMenuOpen}
                  onOpen={onUsersTooltipOpen}
                  onClose={onUsersTooltipClose}
                >
                  <Box sx={styles.collapsedUsersContainer}>
                    <UsersDropdown
                      users={
                        users.length > 0
                          ? users
                          : [
                              {
                                id: user.id,
                                meta: { user_name: user.name, user_avatar: user.avatar },
                              },
                            ]
                      }
                      width={
                        componentWidth ? `${Math.max(parseInt(componentWidth, 10) || 228, 228)}px` : '228px'
                      }
                      placement="left-start"
                      onSelectUser={onSelectParticipant}
                      onDeleteUser={onDeleteParticipant}
                      onAddUsers={onAddUsers}
                      disabledAdd={disabledAdd}
                      currentUserId={user.id}
                      onOpenChange={onUsersMenuOpenChange}
                      slotProps={{
                        IconButton: {
                          sx: styles.usersDropdownIconButton,
                          color: 'secondary',
                        },
                      }}
                    />
                  </Box>
                </StyledTooltip>
              )}
            </>
          ) : (
            /* Expanded View - Accordion Layout */
            <>
              {/* Users Section */}
              <ParticipantsAccordion
                defaultExpanded
                title="Users"
                collapsed={false}
                onAdd={onAddUsers}
                addTooltip="Add Users"
                addIcon={AddUserIcon}
                disabledAdd={disabledAdd}
                canAddMore={!isPrivateProject}
              >
                <Box
                  sx={styles.usersSection}
                  onMouseEnter={() => setIsUsersSectionHovered(true)}
                  onMouseLeave={() => setIsUsersSectionHovered(false)}
                >
                  <Box sx={styles.usersDisplayContainer}>
                    {usersToDisplay.map((participant, index) => (
                      <UserParticipantItem
                        key={ChatParticipantType.Users + index}
                        participant={participant}
                        onClickItem={onSelectParticipant}
                      />
                    ))}
                    <Typography
                      variant="bodyMedium"
                      color="text.primary"
                      sx={styles.usersCountText}
                    >
                      {users.length > usersToDisplay.length ? `+${users.length - usersToDisplay.length}` : ''}
                    </Typography>
                  </Box>
                  {!isPrivateProject && (
                    <UsersDropdown
                      showTrigger={isUsersSectionHovered}
                      users={
                        users.length > 0
                          ? users
                          : [
                              {
                                id: user.id,
                                meta: {
                                  user_name: user.name,
                                  user_avatar: user.avatar,
                                },
                              },
                            ]
                      }
                      width={componentWidth ? `${componentWidth}px` : '228px'}
                      placement="bottom-start"
                      slotProps={{
                        IconButton: {
                          sx: {
                            padding: '6px',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              '& > *': { color: theme.palette.icon.fill.secondary },
                              '& svg': { fill: theme.palette.icon.fill.secondary },
                              '& .MuiSvgIcon-root path': {
                                fill: `${theme.palette.icon.fill.secondary} !important`,
                              },
                            },
                          },
                        },
                        Paper: {
                          sx: styles.usersDropdownPaper,
                        },
                      }}
                      onSelectUser={onSelectParticipant}
                      onDeleteUser={onDeleteParticipant}
                      onAddUsers={onAddUsers}
                      disabledAdd={disabledAdd}
                      currentUserId={user.id}
                    />
                  )}
                </Box>
              </ParticipantsAccordion>
            </>
          )}
          <ParticipantSection
            CollapsedIcon={ApplicationsIcon}
            AddIcon={AddAgentIcon}
            disabledEdit={disabledEdit}
            participants={agentParticipants}
            selectedManager={selectedManager}
            collapsed={collapsed}
            activeParticipantId={activeParticipantId}
            onSelectParticipant={onSelectParticipant}
            onDeleteParticipant={onDeleteParticipant}
            onUpdateParticipant={onUpdateParticipant}
            onEditParticipant={onEditParticipant}
            onAddParticipants={onAddParticipants}
            participantType={ChatParticipantType.Applications}
            entityItems={agentMenuItems}
            onCreateEntity={createNewEntity(ParticipantEntityTypes.Agent)}
            isLoading={isAgentsLoading}
            onRefresh={refreshAgents}
            entityType={ParticipantEntityTypes.Agent}
            onLoadMore={onLoadMoreAgents}
            query={agentQuery}
            setQuery={setAgentQuery}
          />
          <ParticipantSection
            CollapsedIcon={FlowIcon}
            AddIcon={AddPipelineIcon}
            disabledEdit={disabledEdit}
            participants={pipelineParticipants}
            selectedManager={selectedManager}
            collapsed={collapsed}
            activeParticipantId={activeParticipantId}
            onSelectParticipant={onSelectParticipant}
            onDeleteParticipant={onDeleteParticipant}
            onUpdateParticipant={onUpdateParticipant}
            onEditParticipant={onEditParticipant}
            onAddParticipants={onAddParticipants}
            participantType={ChatParticipantType.Pipelines}
            entityItems={pipelineMenuItems}
            onCreateEntity={createNewEntity(ParticipantEntityTypes.Pipeline)}
            isLoading={isPipelinesLoading}
            onRefresh={refreshPipelines}
            entityType={ParticipantEntityTypes.Pipeline}
            onLoadMore={onLoadMorePipelines}
            query={pipelineQuery}
            setQuery={setPipelineQuery}
          />
          <ParticipantSection
            CollapsedIcon={ToolIcon}
            AddIcon={AddToolIcon}
            disabledEdit={disabledEdit}
            participants={toolkitParticipants}
            selectedManager={selectedManager}
            newConversationSelectedManager={newConversationSelectedManager}
            collapsed={collapsed}
            activeParticipantId={activeParticipantId}
            onSelectParticipant={onSelectParticipant}
            onDeleteParticipant={onDeleteParticipant}
            onUpdateParticipant={onUpdateParticipant}
            onEditParticipant={onEditParticipant}
            onAddParticipants={onAddParticipants}
            participantType={ChatParticipantType.Toolkits}
            entityItems={toolkitMenuItems}
            onCreateEntity={createNewEntity(ParticipantEntityTypes.Toolkit)}
            isLoading={isToolkitsLoading}
            onRefresh={refreshToolkits}
            entityType={ParticipantEntityTypes.Toolkit}
            onLoadMore={onLoadMoreToolkits}
            editingToolkit={editingToolkit}
            query={toolkitQuery}
            setQuery={setToolkitQuery}
          />
          <ParticipantSection
            CollapsedIcon={MCPIcon}
            AddIcon={AddMCPIcon}
            disabledEdit={disabledEdit}
            participants={mcpParticipants}
            selectedManager={selectedManager}
            collapsed={collapsed}
            activeParticipantId={activeParticipantId}
            onSelectParticipant={onSelectParticipant}
            onDeleteParticipant={onDeleteParticipant}
            onUpdateParticipant={onUpdateParticipant}
            onEditParticipant={onEditParticipant}
            onAddParticipants={onAddParticipants}
            participantType={ChatParticipantType.Toolkits}
            entityItems={mcpMenuItems}
            onCreateEntity={createNewEntity(ParticipantEntityTypes.MCP)}
            isLoading={isMCPsLoading}
            onRefresh={refreshMCPs}
            entityType={ParticipantEntityTypes.MCP}
            onLoadMore={onLoadMoreMCPs}
            editingToolkit={editingToolkit}
            query={mcpQuery}
            setQuery={setMcpQuery}
          />
        </Box>
      </Box>
      {hideClearChatButton ? null : !collapsed || isSmallWindow ? (
        <Button
          aria-label="Clear the chat history"
          disabled={disabledClear}
          variant="elitea"
          color="secondary"
          onClick={onClearChatHistory}
        >
          Clear chat history
        </Button>
      ) : (
        <Box sx={styles.collapsedClearButtonContainer}>
          <StyledTooltip
            title="Clear chat history"
            placement="left"
          >
            <IconButton
              aria-label="Clear the chat history"
              variant="elitea"
              color="secondary"
              disabled={disabledClear}
              onClick={onClearChatHistory}
              sx={styles.collapsedClearButton}
            >
              <ClearIcon
                sx={styles.clearIcon}
                fill={theme.palette.icon.fill.secondary}
              />
            </IconButton>
          </StyledTooltip>
        </Box>
      )}
      {/* Context Budget Info */}
      {conversationId && (
        <ContextBudgetUI.ContextBudgetInfo
          conversationId={conversationId}
          collapsed={collapsed && !isSmallWindow}
          contextStrategy={contextStrategy}
          setActiveConversation={setActiveConversation}
          conversationInstructions={conversationInstructions}
          persona={persona}
        />
      )}
    </Box>
  );
});

Participants.displayName = 'Participants';

/**
 * Styling definitions for the Participants component.
 * Uses Material-UI's sx prop pattern with theme-aware functions.
 *
 * @type MuiSx
 */
const styles = {
  mainContainer: collapsed => ({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: collapsed ? 'flex-end' : 'flex-start',
    width: '100%',
    height: '100%',
    gap: '12px',
  }),

  contentContainer: (hideClearChatButton, collapsed, isSmallWindow) => ({
    height: !hideClearChatButton ? 'calc(100% - 60px)' : '100%',
    position: 'relative',
    width: collapsed && !isSmallWindow ? '40px' : '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: collapsed && !isSmallWindow ? 'center' : 'flex-start',
    overflowY: 'scroll',
  }),

  headerContainer: (collapsed, isSmallWindow) => ({
    display: 'flex',
    flexDirection: 'row',
    justifyContent: collapsed && !isSmallWindow ? 'center' : 'space-between',
    height: '32px',
    alignItems: 'center',
    width: '100%',
  }),

  titleContainer: {
    display: 'flex',
    flexDirection: 'row',
    height: '100%',
    alignItems: 'center',
    gap: '16px',
  },

  collapseButton: {
    marginLeft: '0px',
  },

  participantsContainer: (collapsed, isSmallWindow) => ({
    marginTop: '8px',
    gap: '8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: !collapsed || isSmallWindow ? 'flex-start' : 'center',
    overflowY: 'scroll',
    msOverflowStyle: 'none',
    scrollbarWidth: 'none',
    '::-webkit-scrollbar': {
      display: 'none',
    },
    maxHeight: `calc(100% - 40px)`,
    paddingBottom: !collapsed || isSmallWindow ? '32px' : '20px',
    paddingTop: !collapsed || isSmallWindow ? '0px' : '8px',
    width: '100%',
  }),

  collapsedUsersContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },

  usersDropdownIconButton: {
    borderRadius: '8px',
  },

  usersSection: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    height: '40px',
    background: palette.background.participant.default,
    '&:hover': {
      background: palette.background.tabButton.hover,
    },
    padding: '6px 12px',
    borderRadius: '8px',
  }),

  usersDisplayContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },

  usersCountText: {
    marginLeft: '4px',
  },

  usersDropdownPaper: {
    marginTop: '8px',
    marginLeft: '0px',
  },

  collapsedClearButtonContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },

  collapsedClearButton: ({ palette }) => ({
    padding: '6px',
    backgroundColor: palette.background.button?.secondary,
    borderRadius: '28px',
    '&:hover': {
      backgroundColor: palette.background.button?.secondaryHover,
    },
  }),

  clearIcon: ({ palette }) => ({
    fontSize: '16px',
    color: palette.icon.fill.secondary,
  }),
};

export default Participants;
