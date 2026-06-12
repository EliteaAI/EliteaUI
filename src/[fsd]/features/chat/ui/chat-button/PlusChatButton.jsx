import React, { forwardRef, memo, useCallback, useRef, useState } from 'react';

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

import { useAvailableInternalTools } from '@/[fsd]/shared/lib/hooks';
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

const EXPANDABLE_ITEMS = [
  { key: 'internalTools', label: 'Internal Tools', Icon: ValueIcon },
  { key: 'agents', label: 'Agents', Icon: ApplicationsIcon },
  { key: 'pipelines', label: 'Pipelines', Icon: FlowIcon },
  { key: 'toolkits', label: 'Toolkits', Icon: ToolIcon },
  { key: 'mcps', label: 'MCPs', Icon: MCPIcon },
];

const PlusChatButton = forwardRef(props => {
  const {
    attachmentButtonRef,
    onAttachFiles,
    disableAttachments = false,
    attachments = [],
    limits,
    onInviteUsers,
    onInternalToolsConfigChange,
    internal_tools = [],
    disableInternalTools = false,
  } = props;

  const theme = useTheme();
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

  const handleClickAway = useCallback(
    event => {
      if (subMenuRef.current?.contains(event.target)) return;
      handleClose();
    },
    [handleClose],
  );

  const handleItemHover = useCallback((key, event) => {
    clearTimeout(hoverTimeoutRef.current);
    setHoveredItem(key);
    setHoveredAnchorEl(event.currentTarget);
  }, []);

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
    setHoveredItem(null);
    setHoveredAnchorEl(null);
  }, []);

  const handleInviteUsers = useCallback(() => {
    handleClose();
    onInviteUsers?.();
  }, [handleClose, onInviteUsers]);

  const styles = plusChatButtonStyles(theme);

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
        title="Add files, agents, tools and more..."
        placement="top"
      >
        <IconButton
          ref={buttonRef}
          variant="elitea"
          color="secondary"
          aria-label="plus menu"
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
              />

              {EXPANDABLE_ITEMS.map(({ key, label, Icon }) => (
                <MenuItem
                  key={key}
                  sx={styles.menuItem}
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
              ))}

              <MenuItem
                sx={styles.menuItem}
                disabled={!canInviteUsers}
                onClick={handleInviteUsers}
              >
                <UsersIcon sx={styles.menuIcon} />
                <Typography sx={styles.menuLabel}>Invite Users</Typography>
              </MenuItem>
            </MenuList>
          </Paper>
        </ClickAwayListener>
      </Popper>

      {hoveredAnchorEl && hoveredItem && (
        <Popper
          open
          anchorEl={hoveredAnchorEl}
          placement="right-start"
          style={styles.subPopper}
        >
          <Paper
            ref={subMenuRef}
            elevation={8}
            sx={hoveredItem === 'internalTools' ? styles.internalToolsPaper : styles.subPaper}
            onMouseEnter={handleSubMenuEnter}
            onMouseLeave={handleSubMenuLeave}
          >
            {hoveredItem === 'internalTools' && availableTools.length > 0 ? (
              availableTools.map(tool => (
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
                    switch: { size: 'small' },
                  }}
                />
              ))
            ) : (
              <Typography sx={styles.comingSoon}>Coming soon</Typography>
            )}
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
  internalToolsPaper: {
    minWidth: '12rem',
    borderRadius: '.75rem',
    border: `.0625rem solid ${theme.palette.border.lines}`,
    backgroundColor: theme.palette.background.secondary,
    padding: '.5rem 0',
    ml: '.25rem',
  },
  toolFormControlLabel: {
    margin: 0,
    width: '15.75rem',
    height: '2.75rem',
    boxSizing: 'border-box',
    display: 'flex',
    padding: '.5rem 1rem',
    gap: '.5rem',
    justifyContent: 'space-between',

    '& .MuiFormControlLabel-label': {
      marginLeft: '.5rem',
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

export default memo(PlusChatButton);
