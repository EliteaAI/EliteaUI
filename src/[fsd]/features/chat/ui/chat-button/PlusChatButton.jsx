import React, { memo, useCallback, useMemo, useRef, useState } from 'react';

import { useSelector } from 'react-redux';

import {
  Box,
  ClickAwayListener,
  IconButton,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';

import { useApplicationSubmenu } from '@/[fsd]/features/chat/lib/hooks';
import { useAvailableInternalTools, useIsMcpVisible } from '@/[fsd]/shared/lib/hooks';
import { Switch, Text } from '@/[fsd]/shared/ui';
import FlowIcon from '@/assets/flow-icon.svg?react';
import MCPIcon from '@/assets/mcp-icon.svg?react';
import ToolIcon from '@/assets/tool-icon.svg?react';
import ValueIcon from '@/assets/value-icon.svg?react';
import ApplicationsIcon from '@/components/Icons/ApplicationsIcon.jsx';
import ArrowRightIcon from '@/components/Icons/ArrowRightIcon';
import PlusIcon from '@/components/Icons/PlusIcon';
import UsersIcon from '@/components/Icons/UsersIcon';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import AttachmentButton from './AttachmentButton';
import PlusChatSubmenu from './PlusChatSubmenu';

const SUBMENU_KEYS = {
  INTERNAL_TOOLS: 'internalTools',
  AGENTS: 'agents',
  PIPELINES: 'pipelines',
  TOOLKITS: 'toolkits',
  MCPS: 'mcps',
};

const EXPANDABLE_ITEMS = [
  { key: SUBMENU_KEYS.INTERNAL_TOOLS, label: 'Modules', Icon: ValueIcon },
  { key: SUBMENU_KEYS.AGENTS, label: 'Agents', Icon: ApplicationsIcon },
  { key: SUBMENU_KEYS.PIPELINES, label: 'Pipelines', Icon: FlowIcon },
  { key: SUBMENU_KEYS.TOOLKITS, label: 'Toolkits', Icon: ToolIcon },
  { key: SUBMENU_KEYS.MCPS, label: 'MCPs', Icon: MCPIcon },
];

const SEARCHABLE_KEYS = [
  SUBMENU_KEYS.AGENTS,
  SUBMENU_KEYS.PIPELINES,
  SUBMENU_KEYS.TOOLKITS,
  SUBMENU_KEYS.MCPS,
];

const PAPER_STYLE_MAP = {
  [SUBMENU_KEYS.INTERNAL_TOOLS]: 'internalToolsPaper',
  [SUBMENU_KEYS.TOOLKITS]: 'toggleSubmenuPaper',
  [SUBMENU_KEYS.MCPS]: 'toggleSubmenuPaper',
  [SUBMENU_KEYS.AGENTS]: 'entitySubmenuPaper',
  [SUBMENU_KEYS.PIPELINES]: 'entitySubmenuPaper',
};

const PlusChatButton = memo(props => {
  const {
    attachmentButtonRef,
    onAttachFiles,
    disableAttachments = false,
    participantDisablesAttachments = false,
    attachments = [],
    limits,
    onInviteUsers,
    onInternalToolsConfigChange,
    internal_tools = [],
    disableInternalTools = false,
    onSelectParticipant,
    onDeleteParticipant,
    onCreateAgent,
    onCreatePipeline,
    onCreateToolkit,
    participants = [],
  } = props;

  const theme = useTheme();
  const isMcpVisible = useIsMcpVisible();
  const availableTools = useAvailableInternalTools();
  const buttonRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  const subMenuRef = useRef(null);

  const selectedProjectId = useSelectedProjectId();
  const personalProjectId = useSelector(state => state.user.personal_project_id);
  const isPrivateProject = selectedProjectId == personalProjectId;
  const canInviteUsers = !isPrivateProject && !!onInviteUsers;

  const [isOpen, setIsOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [hoveredAnchorEl, setHoveredAnchorEl] = useState(null);

  const handleToggle = useCallback(() => {
    setIsOpen(prev => !prev);
    setHoveredItem(null);
    setHoveredAnchorEl(null);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setHoveredItem(null);
    setHoveredAnchorEl(null);
  }, []);

  const { agents, pipelines, toolkits, mcps } = useApplicationSubmenu({
    participants,
    onSelectParticipant,
    onDeleteParticipant,
    onClose: handleClose,
    isOpen,
  });

  const submenuMap = useMemo(
    () => ({
      [SUBMENU_KEYS.AGENTS]: agents,
      [SUBMENU_KEYS.PIPELINES]: pipelines,
      [SUBMENU_KEYS.TOOLKITS]: toolkits,
      ...(isMcpVisible && { [SUBMENU_KEYS.MCPS]: mcps }),
    }),
    [agents, pipelines, toolkits, mcps, isMcpVisible],
  );

  const handleClickAway = useCallback(
    event => {
      if (subMenuRef.current?.contains(event.target)) return;
      handleClose();
    },
    [handleClose],
  );

  const handleItemHover = useCallback(
    (key, event) => {
      clearTimeout(hoverTimeoutRef.current);
      setHoveredItem(prev => {
        if (prev && prev !== key && submenuMap[prev]?.resetSearch) {
          submenuMap[prev].resetSearch();
        }
        return key;
      });
      setHoveredAnchorEl(event.currentTarget);
    },
    [submenuMap],
  );

  const handleItemLeave = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredItem(null);
      setHoveredAnchorEl(null);
    }, 150);
  }, []);

  const handleSubMenuEnter = useCallback(() => {
    clearTimeout(hoverTimeoutRef.current);
  }, []);

  const handleSubMenuLeave = useCallback(() => {
    if (subMenuRef.current?.contains(document.activeElement)) return;
    setHoveredItem(null);
    setHoveredAnchorEl(null);
  }, []);

  const handleCloseAndCall = useCallback(
    (callback, ...args) => {
      handleClose();
      callback?.(...args);
    },
    [handleClose],
  );

  const handleCreateAgent = useCallback(
    () => handleCloseAndCall(onCreateAgent),
    [handleCloseAndCall, onCreateAgent],
  );

  const handleCreatePipeline = useCallback(
    () => handleCloseAndCall(onCreatePipeline),
    [handleCloseAndCall, onCreatePipeline],
  );

  const handleCreateToolkit = useCallback(
    () => handleCloseAndCall(onCreateToolkit),
    [handleCloseAndCall, onCreateToolkit],
  );

  const handleCreateMCP = useCallback(
    () => handleCloseAndCall(onCreateToolkit, true),
    [handleCloseAndCall, onCreateToolkit],
  );

  const handleInviteUsers = useCallback(
    () => handleCloseAndCall(onInviteUsers),
    [handleCloseAndCall, onInviteUsers],
  );

  const submenuConfigs = useMemo(
    () => ({
      [SUBMENU_KEYS.AGENTS]: {
        searchPlaceholder: 'Search agents...',
        showCreateNew: !!onCreateAgent,
        createNewLabel: 'Create New Agent',
        onCreateNew: handleCreateAgent,
        emptyMessage: 'No agents available',
        noResultsMessage: 'No agents found',
      },
      [SUBMENU_KEYS.PIPELINES]: {
        searchPlaceholder: 'Search pipelines...',
        showCreateNew: !!onCreatePipeline,
        createNewLabel: 'Create New Pipeline',
        onCreateNew: handleCreatePipeline,
        emptyMessage: 'No pipelines available',
        noResultsMessage: 'No pipelines found',
      },
      [SUBMENU_KEYS.TOOLKITS]: {
        searchPlaceholder: 'Search toolkits...',
        showCreateNew: !!onCreateToolkit,
        createNewLabel: 'Create New Toolkit',
        onCreateNew: handleCreateToolkit,
        emptyMessage: 'No toolkits available',
        noResultsMessage: 'No toolkits found',
        showToggle: true,
        showPublicLabel: false,
      },
      ...(isMcpVisible && {
        [SUBMENU_KEYS.MCPS]: {
          searchPlaceholder: 'Search MCPs...',
          showCreateNew: !!onCreateToolkit,
          createNewLabel: 'Create New MCP',
          onCreateNew: handleCreateMCP,
          emptyMessage: 'No MCPs available',
          noResultsMessage: 'No MCPs found',
          showToggle: true,
          showPublicLabel: false,
        },
      }),
    }),
    [
      onCreateAgent,
      onCreatePipeline,
      onCreateToolkit,
      handleCreateAgent,
      handleCreatePipeline,
      handleCreateToolkit,
      handleCreateMCP,
      isMcpVisible,
    ],
  );

  const styles = plusChatButtonStyles(theme);
  const paperStyleKey = PAPER_STYLE_MAP[hoveredItem] || 'subPaper';

  const renderSubmenuContent = useCallback(() => {
    if (hoveredItem === SUBMENU_KEYS.INTERNAL_TOOLS && availableTools.length > 0) {
      return availableTools.map(tool => (
        <Switch.BaseSwitch
          key={tool.name}
          label={tool.title}
          checked={internal_tools.includes(tool.name)}
          disabled={disableInternalTools}
          onChange={(_, checkedValue) =>
            onInternalToolsConfigChange?.({ key: tool.name, value: checkedValue })
          }
          width="100%"
          infoTooltip={<Text.TextWithLink {...tool.infoTooltip} />}
          slotProps={{
            formControlLabel: {
              sx: styles.toolFormControlLabel,
              labelPlacement: 'start',
            },
            label: { sx: { whiteSpace: 'nowrap' } },
            switch: { size: 'small' },
          }}
        />
      ));
    }

    if (SEARCHABLE_KEYS.includes(hoveredItem)) {
      if (hoveredItem === SUBMENU_KEYS.MCPS && !isMcpVisible) return null;
      const data = submenuMap[hoveredItem];
      const config = submenuConfigs[hoveredItem];
      if (!data || !config) return null;
      return (
        <PlusChatSubmenu
          items={data.items}
          searchValue={data.searchValue}
          onSearchChange={data.onSearchChange}
          onScroll={data.onScroll}
          isLoading={data.isLoading}
          {...config}
        />
      );
    }
  }, [
    hoveredItem,
    isMcpVisible,
    availableTools,
    internal_tools,
    disableInternalTools,
    onInternalToolsConfigChange,
    submenuMap,
    submenuConfigs,
    styles,
  ]);

  return (
    <>
      <Box sx={styles.hiddenAttachment}>
        <AttachmentButton
          ref={attachmentButtonRef}
          onAttachFiles={onAttachFiles}
          attachments={attachments}
          limits={limits}
        />
      </Box>

      <Tooltip
        title="Add files, agents, toolkits and more..."
        placement="top"
      >
        <IconButton
          ref={buttonRef}
          variant="elitea"
          color="secondary"
          aria-label="plus menu"
          data-testid="plus-menu-button"
          onClick={handleToggle}
        >
          <PlusIcon fill={theme.palette.icon.fill.secondary} />
        </IconButton>
      </Tooltip>

      <Popper
        open={isOpen}
        anchorEl={buttonRef.current}
        placement="bottom-start"
        style={styles.popper}
        modifiers={popperModifiers}
      >
        <ClickAwayListener onClickAway={handleClickAway}>
          <Paper
            elevation={8}
            sx={styles.paper}
          >
            <MenuList sx={styles.menuList}>
              <AttachmentButton
                showLabel
                onAttachFiles={onAttachFiles}
                disableAttachments={disableAttachments}
                attachments={attachments}
                limits={limits}
                disabledTooltip={
                  participantDisablesAttachments
                    ? "Attachments aren't available for the selected agent or pipeline."
                    : undefined
                }
              />

              {EXPANDABLE_ITEMS.filter(item => item.key !== SUBMENU_KEYS.MCPS || isMcpVisible).map(
                ({ key, label, Icon }) => (
                  <MenuItem
                    key={key}
                    sx={styles.menuItem}
                    data-testid={key === SUBMENU_KEYS.INTERNAL_TOOLS ? 'internal-tools-menuitem' : undefined}
                    onMouseEnter={e => handleItemHover(key, e)}
                    onMouseLeave={handleItemLeave}
                  >
                    <Box
                      component={Icon}
                      sx={styles.menuIcon}
                    />
                    <Typography sx={styles.menuLabel}>{label}</Typography>
                    <ArrowRightIcon sx={styles.chevron} />
                  </MenuItem>
                ),
              )}

              {!isPrivateProject && (
                <MenuItem
                  sx={styles.menuItem}
                  disabled={!canInviteUsers}
                  onClick={handleInviteUsers}
                >
                  <UsersIcon sx={styles.menuIcon} />
                  <Typography sx={styles.menuLabel}>Invite Users</Typography>
                </MenuItem>
              )}
            </MenuList>
          </Paper>
        </ClickAwayListener>
      </Popper>

      {hoveredAnchorEl && hoveredItem && (
        <Popper
          open
          anchorEl={hoveredAnchorEl}
          placement="right-end"
          style={styles.subPopper}
        >
          <Paper
            ref={subMenuRef}
            elevation={8}
            sx={styles[paperStyleKey]}
            onMouseEnter={handleSubMenuEnter}
            onMouseLeave={handleSubMenuLeave}
          >
            {renderSubmenuContent()}
          </Paper>
        </Popper>
      )}
    </>
  );
});

PlusChatButton.displayName = 'PlusChatButton';

/** @type {MuiSx} */
const plusChatButtonStyles = theme => ({
  hiddenAttachment: {
    position: 'absolute',
    width: 0,
    height: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  popper: {
    zIndex: 9998,
  },
  paper: {
    minWidth: '15.125rem',
    borderRadius: '.75rem',
    border: `.0625rem solid ${theme.palette.border.lines}`,
    backgroundColor: theme.palette.background.secondary,
    padding: 0,
    overflow: 'hidden',
  },
  menuList: {
    padding: 0,
    '& > .MuiIconButton-root': {
      width: '100%',
      height: '2.75rem',
      justifyContent: 'flex-start',
      padding: '.5rem 1rem',
      gap: '.75rem',
      color: theme.palette.text.secondary,
      background: 'transparent !important',
      borderRadius: 0,
      borderBottom: `.0625rem solid ${theme.palette.border.lines}`,
      '&:hover': {
        backgroundColor: `${theme.palette.action.hover} !important`,
      },
      '&.Mui-disabled': {
        background: 'transparent !important',
        color: theme.palette.text.disabled,
        opacity: 1,
      },
    },
    '& > .MuiIconButton-root svg': {
      width: '.75rem',
      height: '.75rem',
      flexShrink: 0,
      color: 'rgba(169, 183, 193, 1)',
    },
    '& > .MuiIconButton-root .MuiTypography-root': {
      fontSize: '.875rem',
      lineHeight: '1.5rem',
      fontWeight: 400,
    },
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '.75rem',
    padding: '.5rem 1rem',
    height: '2.75rem',
    color: theme.palette.text.secondary,
  },
  menuIcon: {
    width: '.75rem',
    height: '.75rem',
    fontSize: '.75rem',
    flexShrink: 0,
    color: 'rgba(169, 183, 193, 1)',
  },
  menuLabel: {
    flex: 1,
    fontSize: '.875rem',
    lineHeight: '1.5rem',
    fontWeight: 400,
  },
  chevron: {
    fontSize: '1rem',
    flexShrink: 0,
    color: 'rgba(169, 183, 193, 1)',
  },
  subPopper: {
    zIndex: 9999,
  },
  subPaper: {
    minWidth: '12rem',
    borderRadius: '.75rem',
    border: `.0625rem solid ${theme.palette.border.lines}`,
    backgroundColor: theme.palette.background.secondary,
    padding: '1rem',
    ml: '.25rem',
  },
  entitySubmenuPaper: {
    width: '14.25rem',
    borderRadius: '.5rem',
    border: `.0625rem solid ${theme.palette.border.lines}`,
    backgroundColor: theme.palette.background.secondary,
    boxShadow: theme.palette.boxShadow.default,
    padding: 0,
    ml: '.25rem',
    overflow: 'hidden',
  },
  toggleSubmenuPaper: {
    width: '17rem',
    borderRadius: '.5rem',
    border: `.0625rem solid ${theme.palette.border.lines}`,
    backgroundColor: theme.palette.background.secondary,
    boxShadow: theme.palette.boxShadow.default,
    padding: 0,
    ml: '.25rem',
    overflow: 'hidden',
  },
  internalToolsPaper: {
    minWidth: '18.75rem',
    borderRadius: '.75rem',
    border: `.0625rem solid ${theme.palette.border.lines}`,
    backgroundColor: theme.palette.background.secondary,
    padding: '.5rem 0',
    ml: '.25rem',
  },
  toolFormControlLabel: {
    margin: 0,
    width: '18.75rem',
    height: '2.75rem',
    boxSizing: 'border-box',
    display: 'flex',
    padding: '.5rem 1rem',
    gap: '.5rem',
    justifyContent: 'space-between',

    '& .MuiFormControlLabel-label': {
      marginLeft: '.5rem',
      whiteSpace: 'nowrap',
    },
  },
  comingSoon: {
    color: theme.palette.text.disabled,
    textAlign: 'center',
    fontSize: '.875rem',
    lineHeight: '1.5rem',
    fontWeight: 400,
  },
});

const popperModifiers = [
  {
    name: 'offset',
    options: {
      offset: [0, 8],
    },
  },
];

export default PlusChatButton;
