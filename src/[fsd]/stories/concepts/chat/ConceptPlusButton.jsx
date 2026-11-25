// Chat concept: the «+» menu under the field. A copy of src/[fsd]/features/chat/ui/chat-button/PlusChatButton.jsx;
// the lines marked «concept:» are the changes, the rest (the button and its tooltip, Attach Files with its limits and
// «not available» tooltip, the hidden file input for drop and paste, a submenu per kind, Create <Kind>, closing on Esc,
// on a click outside and after a pick, the MCPs flag) is the team's code.
// - concept: no «Invite Users» — people are invited from Share in the chat's header;
// - concept: each row says how many of its kind are in the chat: «Modules 2», «Agents 3», «Pipelines 1», «Skills 2»,
//   «Toolkits 3», «MCPs 1» (today: a chevron only);
// - concept: each Modules row has its icon, name, description and switch in a 420 px list (today: name, switch and an
//   «i» tooltip, 300 px). All of today's modules stay here: Ask User, Planner, Python Sandbox, Swarm Mode and Smart
//   Tools Selection;
// - concept: a kind's list is a 600 px window with two-line rows (ConceptPlusSubmenu, useConceptPlusSubmenu);
//   it keeps the chat's agents, pipelines and skills on top under «In this chat · N».
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

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

import AttachmentButton from '@/[fsd]/features/chat/ui/chat-button/AttachmentButton';
import { useAvailableInternalTools } from '@/[fsd]/features/toolkits';
import { ParticipantEntityConstants } from '@/[fsd]/shared/lib/constants';
import { useIsMcpVisible } from '@/[fsd]/shared/lib/hooks';
import { Text } from '@/[fsd]/shared/ui';
import FlowIcon from '@/assets/flow-icon.svg?react';
import MCPIcon from '@/assets/mcp-icon.svg?react';
import SkillIcon from '@/assets/skill-icon.svg?react';
import ToolIcon from '@/assets/tool-icon.svg?react';
import ValueIcon from '@/assets/value-icon.svg?react';
import { ChatParticipantType } from '@/common/constants';
import ApplicationsIcon from '@/components/Icons/ApplicationsIcon.jsx';
import ArrowRightIcon from '@/components/Icons/ArrowRightIcon';
import PlusIcon from '@/components/Icons/PlusIcon';

import ConceptModuleRow from './ConceptModuleRow';
import ConceptPlusSubmenu from './ConceptPlusSubmenu';
import { isMcpParticipant, isPipelineParticipant } from './conceptParticipant.helpers';
import { useConceptPlusSubmenu } from './useConceptPlusSubmenu.hooks';

const SUBMENU_KEYS = {
  INTERNAL_TOOLS: 'internalTools',
  AGENTS: 'agents',
  PIPELINES: 'pipelines',
  SKILLS: 'skills',
  TOOLKITS: 'toolkits',
  MCPS: 'mcps',
};

const EXPANDABLE_ITEMS = [
  { key: SUBMENU_KEYS.INTERNAL_TOOLS, label: 'Modules', Icon: ValueIcon, testId: 'internal-tools-menuitem' },
  { key: SUBMENU_KEYS.AGENTS, label: 'Agents', Icon: ApplicationsIcon, testId: 'agents-menuitem' },
  { key: SUBMENU_KEYS.PIPELINES, label: 'Pipelines', Icon: FlowIcon, testId: 'pipelines-menuitem' },
  { key: SUBMENU_KEYS.SKILLS, label: 'Skills', Icon: SkillIcon, testId: 'skills-menuitem' },
  { key: SUBMENU_KEYS.TOOLKITS, label: 'Toolkits', Icon: ToolIcon, testId: 'toolkits-menuitem' },
  { key: SUBMENU_KEYS.MCPS, label: 'MCPs', Icon: MCPIcon, testId: 'mcps-menuitem' },
];

const SEARCHABLE_KEYS = [
  SUBMENU_KEYS.AGENTS,
  SUBMENU_KEYS.PIPELINES,
  SUBMENU_KEYS.SKILLS,
  SUBMENU_KEYS.TOOLKITS,
  SUBMENU_KEYS.MCPS,
];

// concept: how many of each kind the chat has (the number on the menu's row)
const countInChat = participants => ({
  [SUBMENU_KEYS.AGENTS]: participants.filter(
    p => p.entity_name === ChatParticipantType.Applications && !isPipelineParticipant(p),
  ).length,
  [SUBMENU_KEYS.PIPELINES]: participants.filter(isPipelineParticipant).length,
  [SUBMENU_KEYS.SKILLS]: participants.filter(p => p.entity_name === ChatParticipantType.Skills).length,
  [SUBMENU_KEYS.TOOLKITS]: participants.filter(
    p => p.entity_name === ChatParticipantType.Toolkits && !isMcpParticipant(p),
  ).length,
  [SUBMENU_KEYS.MCPS]: participants.filter(
    p => p.entity_name === ChatParticipantType.Toolkits && isMcpParticipant(p),
  ).length,
});

const ConceptPlusButton = memo(props => {
  const {
    attachmentButtonRef,
    onAttachFiles,
    disableAttachments = false,
    participantDisablesAttachments = false,
    attachments = [],
    limits,
    onInternalToolsConfigChange,
    internal_tools = [],
    disableInternalTools = false,
    onSelectParticipant,
    onDeleteParticipant,
    onCreateAgent,
    onCreatePipeline,
    onCreateToolkit,
    onCreateSkill,
    participants = [],
  } = props;

  const theme = useTheme();
  const isMcpVisible = useIsMcpVisible();
  const availableTools = useAvailableInternalTools({ activeToolNames: internal_tools });
  const buttonRef = useRef(null);
  const subMenuRef = useRef(null);
  const mainPaperRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [openItem, setOpenItem] = useState(null);

  const handleToggle = useCallback(() => {
    setIsOpen(prev => !prev);
    setOpenItem(null);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setOpenItem(null);
  }, []);

  const { agents, pipelines, skills, toolkits, mcps } = useConceptPlusSubmenu({
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
      [SUBMENU_KEYS.SKILLS]: skills,
      [SUBMENU_KEYS.TOOLKITS]: toolkits,
      ...(isMcpVisible && { [SUBMENU_KEYS.MCPS]: mcps }),
    }),
    [agents, pipelines, skills, toolkits, mcps, isMcpVisible],
  );

  // concept: the numbers on the menu's rows
  const counts = useMemo(
    () => ({
      ...countInChat(participants),
      [SUBMENU_KEYS.INTERNAL_TOOLS]: availableTools.filter(
        tool => !tool.unavailable && internal_tools.includes(tool.name),
      ).length,
    }),
    [participants, availableTools, internal_tools],
  );

  const handleClickAway = useCallback(
    event => {
      if (subMenuRef.current?.contains(event.target)) return;
      handleClose();
    },
    [handleClose],
  );

  const handleItemClick = useCallback(
    key => {
      setOpenItem(prev => {
        if (prev && submenuMap[prev]?.resetSearch) submenuMap[prev].resetSearch();
        return prev === key ? null : key;
      });
    },
    [submenuMap],
  );

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = event => {
      if (event.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  // Callback ref: the main paper mounts only when the Popper opens
  const setMainPaper = useCallback(node => {
    mainPaperRef.current = node;
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

  const handleCreateSkill = useCallback(
    () => handleCloseAndCall(onCreateSkill),
    [handleCloseAndCall, onCreateSkill],
  );

  const handleCreateToolkit = useCallback(
    () => handleCloseAndCall(onCreateToolkit),
    [handleCloseAndCall, onCreateToolkit],
  );

  const handleCreateMCP = useCallback(
    () => handleCloseAndCall(onCreateToolkit, true),
    [handleCloseAndCall, onCreateToolkit],
  );

  const submenuConfigs = useMemo(
    () => ({
      [SUBMENU_KEYS.AGENTS]: {
        searchPlaceholder: 'Search agents...',
        showCreateNew: !!onCreateAgent,
        createNewLabel: 'Create Agent',
        onCreateNew: handleCreateAgent,
        emptyMessage: 'No agents available',
        noResultsMessage: 'No agents found',
        kindLabel: 'Agents',
        removeLabel: 'Remove agent',
        allLabel: 'All agents',
      },
      [SUBMENU_KEYS.PIPELINES]: {
        searchPlaceholder: 'Search pipelines...',
        showCreateNew: !!onCreatePipeline,
        createNewLabel: 'Create Pipeline',
        onCreateNew: handleCreatePipeline,
        emptyMessage: 'No pipelines available',
        noResultsMessage: 'No pipelines found',
        kindLabel: 'Pipelines',
        removeLabel: 'Remove pipeline',
        allLabel: 'All pipelines',
      },
      [SUBMENU_KEYS.SKILLS]: {
        searchPlaceholder: 'Search skills...',
        showCreateNew: !!onCreateSkill,
        createNewLabel: 'Create Skill',
        onCreateNew: handleCreateSkill,
        emptyMessage: 'No skills available',
        noResultsMessage: 'No skills found',
        publicLabel: ParticipantEntityConstants.CATALOG_LABEL,
        kindLabel: 'Skills',
        removeLabel: 'Remove skill',
        allLabel: 'All skills',
      },
      [SUBMENU_KEYS.TOOLKITS]: {
        searchPlaceholder: 'Search toolkits...',
        showCreateNew: !!onCreateToolkit,
        createNewLabel: 'Create Toolkit',
        onCreateNew: handleCreateToolkit,
        emptyMessage: 'No toolkits available',
        noResultsMessage: 'No toolkits found',
        showToggle: true,
        showPublicLabel: false,
        kindLabel: 'Toolkits',
        allLabel: 'All toolkits',
      },
      ...(isMcpVisible && {
        [SUBMENU_KEYS.MCPS]: {
          searchPlaceholder: 'Search MCPs...',
          showCreateNew: !!onCreateToolkit,
          createNewLabel: 'Create MCP',
          onCreateNew: handleCreateMCP,
          emptyMessage: 'No MCPs available',
          noResultsMessage: 'No MCPs found',
          showToggle: true,
          showPublicLabel: false,
          kindLabel: 'MCPs',
          allLabel: 'All MCPs',
        },
      }),
    }),
    [
      onCreateAgent,
      onCreatePipeline,
      onCreateToolkit,
      onCreateSkill,
      handleCreateAgent,
      handleCreatePipeline,
      handleCreateSkill,
      handleCreateToolkit,
      handleCreateMCP,
      isMcpVisible,
    ],
  );

  const styles = conceptPlusButtonStyles();

  const renderSubmenuContent = useCallback(() => {
    if (openItem === SUBMENU_KEYS.INTERNAL_TOOLS && availableTools.length > 0) {
      // concept: a module row — icon, name, description, switch (ConceptModuleRow)
      return availableTools.map(tool => {
        const description = tool.unavailable ? { text: tool.unavailableTooltip } : tool.infoTooltip;
        return (
          <ConceptModuleRow
            key={tool.name}
            tool={tool}
            title={tool.title}
            description={<Text.TextWithLink {...description} />}
            checked={internal_tools.includes(tool.name) && !tool.unavailable}
            disabled={disableInternalTools || tool.unavailable}
            onToggle={value => onInternalToolsConfigChange?.({ key: tool.name, value })}
          />
        );
      });
    }

    if (SEARCHABLE_KEYS.includes(openItem)) {
      if (openItem === SUBMENU_KEYS.MCPS && !isMcpVisible) return null;
      const data = submenuMap[openItem];
      const config = submenuConfigs[openItem];
      if (!data || !config) return null;
      return (
        <ConceptPlusSubmenu
          // Remount per row so the search box regains focus
          key={openItem}
          items={data.items}
          inChat={data.inChat}
          total={data.total}
          searchValue={data.searchValue}
          onSearchChange={data.onSearchChange}
          onScroll={data.onScroll}
          isLoading={data.isLoading}
          sectionKey={openItem}
          {...config}
        />
      );
    }
  }, [
    openItem,
    isMcpVisible,
    availableTools,
    internal_tools,
    disableInternalTools,
    onInternalToolsConfigChange,
    submenuMap,
    submenuConfigs,
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
          <PlusIcon fill={theme.palette.icon.secondary} />
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
            ref={setMainPaper}
            elevation={8}
            sx={styles.paper}
          >
            <MenuList sx={styles.menuList}>
              <AttachmentButton
                showLabel
                testId="chat-attach-menuitem-button"
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
                ({ key, label, Icon, testId }) => (
                  <MenuItem
                    key={key}
                    sx={styles.menuItem}
                    data-testid={testId}
                    selected={openItem === key}
                    aria-haspopup="menu"
                    aria-expanded={openItem === key}
                    onClick={() => handleItemClick(key)}
                  >
                    <Box
                      component={Icon}
                      sx={styles.menuIcon}
                    />
                    <Typography sx={styles.menuLabel}>{label}</Typography>
                    {/* concept: how many of this kind are in the chat */}
                    {counts[key] > 0 && (
                      <Typography
                        variant="bodyMedium"
                        sx={styles.count}
                        data-testid={`${testId}-count`}
                      >
                        {counts[key]}
                      </Typography>
                    )}
                    <Box
                      component={ArrowRightIcon}
                      sx={styles.chevron}
                      fill={theme.palette.icon.default}
                    />
                  </MenuItem>
                ),
              )}

              {/* concept: no «Invite Users» — people are invited from Share in the header */}
            </MenuList>
          </Paper>
        </ClickAwayListener>
      </Popper>

      {isOpen && openItem && (
        <Popper
          open
          anchorEl={mainPaperRef.current}
          placement="right-start"
          style={styles.subPopper}
          modifiers={subPopperModifiers}
        >
          <Paper
            ref={subMenuRef}
            elevation={8}
            sx={[
              styles.subPaper,
              openItem === SUBMENU_KEYS.INTERNAL_TOOLS ? styles.internalToolsPaper : styles.kindPaper,
            ]}
            data-testid={`${openItem}-submenu`}
          >
            {renderSubmenuContent()}
          </Paper>
        </Popper>
      )}
    </>
  );
});

ConceptPlusButton.displayName = 'ConceptPlusButton';

/** @type {MuiSx} */
const conceptPlusButtonStyles = () => ({
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
  paper: ({ palette }) => ({
    minWidth: '15.125rem',
    borderRadius: '.75rem',
    border: `.0625rem solid ${palette.border.lines}`,
    backgroundColor: palette.background.default.secondary,
    padding: 0,
    overflow: 'hidden',
  }),
  menuList: ({ palette }) => ({
    padding: 0,
    '& > .MuiIconButton-root': {
      width: '100%',
      height: '2.75rem',
      justifyContent: 'flex-start',
      padding: '.5rem 1rem',
      gap: '.75rem',
      color: palette.text.secondary,
      background: 'transparent !important',
      borderRadius: 0,
      borderBottom: `.0625rem solid ${palette.border.lines}`,
      '&:hover': {
        backgroundColor: `${palette.action.hover} !important`,
      },
      '&.Mui-disabled': {
        background: 'transparent !important',
        color: palette.text.disabled,
        opacity: 1,
      },
    },
    '& > .MuiIconButton-root svg': {
      width: '1rem',
      height: '1rem',
      flexShrink: 0,
      color: palette.icon.default,
    },
    '& > .MuiIconButton-root .MuiTypography-root': {
      fontSize: '.875rem',
      lineHeight: '1.5rem',
      fontWeight: 400,
    },
    // concept: no «10 left» after Attach Files; the limits and their toasts stay (in the product: a prop of AttachmentButton)
    '& > .MuiIconButton-root .MuiTypography-root + .MuiTypography-root': {
      display: 'none',
    },
  }),
  menuItem: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '.75rem',
    padding: '.5rem 1rem',
    height: '2.75rem',
    color: palette.text.secondary,
    backgroundColor: palette.background.default.secondary,
    '&:hover, &.Mui-selected, &.Mui-selected:hover': {
      backgroundColor: palette.background.surface.interactive.active,
    },
  }),
  menuIcon: ({ palette }) => ({
    width: '1rem',
    height: '1rem',
    fontSize: '1rem',
    flexShrink: 0,
    color: palette.icon.default,
  }),
  menuLabel: {
    flex: 1,
    fontSize: '.875rem',
    lineHeight: '1.5rem',
    fontWeight: 400,
  },
  // concept: the number before the chevron
  count: ({ palette }) => ({
    color: palette.text.primary,
    flexShrink: 0,
  }),
  chevron: ({ palette }) => ({
    fontSize: '1rem',
    flexShrink: 0,
    color: palette.icon.default,
  }),
  subPopper: {
    zIndex: 9999,
  },
  subPaper: ({ palette }) => ({
    boxSizing: 'border-box',
    borderRadius: '.75rem',
    border: `.0625rem solid ${palette.border.lines}`,
    backgroundColor: palette.background.default.secondary,
    padding: 0,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  }),
  // concept: a kind's list is 600 px wide (at 400 the descriptions are cut) and keeps one height
  // while the search changes its rows (dev: 300 px, the main menu's height)
  kindPaper: {
    width: '37.5rem',
    maxWidth: 'calc(100vw - 1rem)',
    height: 'min(32.5rem, calc(100vh - 1rem))',
  },
  // concept: modules with descriptions — 420 px (dev: 300 px)
  internalToolsPaper: {
    width: '26.25rem',
    padding: '.5rem 0',
    maxHeight: 'calc(100vh - 1rem)',
    overflowY: 'auto',
  },
});

const popperModifiers = [
  {
    name: 'offset',
    options: {
      offset: [0, 8],
    },
  },
  // concept: the menu stays inside the window; in a new chat on a short window (1440×630) it opened down and cut MCPs
  { name: 'preventOverflow', options: { boundary: 'viewport', altAxis: true, padding: 8 } },
];

// concept: the kind's list is taller than the menu; it stays inside the window
const subPopperModifiers = [
  { name: 'offset', options: { offset: [0, 4] } },
  { name: 'preventOverflow', options: { boundary: 'viewport', altAxis: true, padding: 8 } },
  { name: 'flip', enabled: false },
];

export default ConceptPlusButton;
