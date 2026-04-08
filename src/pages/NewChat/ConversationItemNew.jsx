import { useCallback, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';

import { Box, Typography, useTheme } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { Input } from '@/[fsd]/shared/ui';
import CheckedIcon from '@/assets/checked-icon.svg?react';
import {
  ConversationNameRegExp,
  ConversationNameWarningMessage,
  MAX_CONVERSATION_LENGTH,
  PERMISSIONS,
  PUBLIC_PROJECT_ID,
} from '@/common/constants';
import DotMenu from '@/components/DotMenu';
import ArrowRightIcon from '@/components/Icons/ArrowRightIcon.jsx';
import CancelIcon from '@/components/Icons/CancelIcon';
import EditIcon from '@/components/Icons/EditIcon';
import ExportIcon from '@/components/Icons/ExportIcon';
import MoveTo from '@/components/Icons/MoveTo';
import OpenEyeIcon from '@/components/Icons/OpenEyeIcon';
import PinIcon from '@/components/Icons/PinIcon';
import PlayIcon from '@/components/Icons/PlayIcon';
import UsersIcon from '@/components/Icons/UsersIcon';
import useCheckPermission from '@/hooks/useCheckPermission';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import DeleteIcon from '../../components/Icons/DeleteIcon';
import DraggableConversationItem from './DraggableConversationItem';

const isExportingAPIReady = false;

const ConversationItem = ({
  conversation = {},
  onSelectConversation,
  isActive = false,
  onDelete,
  onExport,
  onEdit,
  onPlayback,
  onPin,
  onCreateConversation,
  onCancelCreate,
  onChangeActiveConversationName,
  moveToFoldersMenuItems = {},
  isEditingCanvas,
  enableDragAndDrop = false,
  isDragDisabled = false,
}) => {
  const { checkPermission } = useCheckPermission();
  const { id: userId } = useSelector(state => state.user);
  const {
    name,
    users_count = 1,
    is_private,
    chat_history = [],
    isPlayback,
    isPinned,
    isNew,
    author_id,
  } = conversation;
  const [conversationName, setConversationName] = useState(name);
  const isConversationNameValid = useMemo(
    () => ConversationNameRegExp.test(conversationName ?? ''),
    [conversationName],
  );
  const [isHovering, setIsHovering] = useState(false);
  const projectId = useSelectedProjectId();
  const theme = useTheme();
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(isNew);

  // Get conversation type for icon logic
  const getConversationType = () => {
    if (!is_private) return 'public';
    return users_count > 1 ? 'private_with_users' : 'private_without_users';
  };

  const conversationType = getConversationType();

  const mainBodyWidth = useMemo(() => {
    // Calculate width based on conversation type and state
    let rightMargin = 0;

    // Add margin for menu when hovering
    if (isHovering || showMenu) rightMargin += 32;

    // Add margin for pin icon
    if (isPinned && !isPlayback) rightMargin += 20;

    // Add margin for users icon based on conversation type
    if (conversationType === 'private_with_users' || conversationType === 'public') {
      rightMargin += 20;
    }

    // Add margin for playback icon
    if (isPlayback) rightMargin += 24;

    return `calc(100% - ${rightMargin}px)`;
  }, [isHovering, showMenu, isPinned, isPlayback, conversationType]);
  const onClickConversation = useCallback(() => {
    if (!isActive) {
      onSelectConversation(conversation);
    }
  }, [conversation, isActive, onSelectConversation]);

  const handlePin = useCallback(async () => {
    onPin(conversation, !isPinned);
  }, [conversation, isPinned, onPin]);

  const handleDelete = useCallback(async () => {
    onDelete(conversation);
  }, [conversation, onDelete]);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleMakePublic = useCallback(() => {
    if (is_private) {
      onEdit({ ...conversation, is_private: false });
    }
  }, [conversation, is_private, onEdit]);

  const handlePlayback = useCallback(() => {
    onPlayback(conversation);
  }, [conversation, onPlayback]);

  const menuItems = useMemo(() => {
    const items = !isPlayback
      ? [
          {
            label: 'Delete',
            icon: <DeleteIcon sx={{ fontSize: '1rem' }} />,
            alertTitle: 'Delete conversation?',
            confirmButtonTitle: 'Delete',
            confirmText: "Are you sure to delete conversation? It can't be restored.",
            alarm: true,
            disabled: userId != author_id || (isActive && isEditingCanvas),
            onConfirm: handleDelete,
          },
          {
            label: 'Edit',
            icon: <EditIcon sx={{ fontSize: '1rem' }} />,
            disabled: userId != author_id || (isActive && isEditingCanvas),
            onClick: handleEdit,
          },
          {
            label: (
              <Box
                style={{
                  display: 'flex',
                  gap: '36px',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Box>Move to</Box>
                <ArrowRightIcon />
              </Box>
            ),
            icon: <MoveTo sx={{ fontSize: '1rem' }} />,
            hasSubMenu: true,
            disabled:
              !checkPermission(PERMISSIONS.chat.folders.create) ||
              !checkPermission(PERMISSIONS.chat.folders.update) ||
              (isActive && isEditingCanvas),
            subMenuItems: moveToFoldersMenuItems,
          },
          {
            label: 'Export',
            icon: <ExportIcon sx={{ fontSize: '1rem' }} />,
            hasSubMenu: true,
            disabled: !isExportingAPIReady,
            subMenuItems: [
              {
                label: 'Option1',
                onClick: onExport,
              },
              {
                label: 'Option2',
                onClick: onExport,
              },
            ],
            onClick: handleEdit,
          },
          {
            label: 'Make public',
            icon: <OpenEyeIcon sx={{ fontSize: '1rem' }} />,
            alertTitle: 'Public conversation?',
            confirmButtonTitle: 'Make public',
            confirmText: 'Are you sure to make your conversation public?',
            confirmButtonSX: {
              background: `${theme.palette.background.button.primary.default} !important`,
              color: `${theme.palette.text.button.primary} !important`,
            },
            onConfirm: handleMakePublic,
            display: projectId == PUBLIC_PROJECT_ID ? 'none' : undefined,
            disabled: isActive && isEditingCanvas,
          },
          {
            label: 'Playback',
            icon: <PlayIcon sx={{ fontSize: '1rem' }} />,
            disabled: isActive && isEditingCanvas,
            onClick: handlePlayback,
          },
          {
            label: isPinned ? 'Unpin' : 'Pin on top',
            icon: <PinIcon sx={{ fontSize: '1rem' }} />,
            onClick: handlePin,
          },
        ].filter(item => item.display !== 'none')
      : [
          {
            label: 'Delete',
            icon: <DeleteIcon sx={{ fontSize: '1rem' }} />,
            alertTitle: 'Delete playback',
            confirmButtonTitle: 'Delete',
            confirmText: 'Are you sure to delete playback?',
            onConfirm: handleDelete,
          },
          {
            label: 'Edit',
            icon: <EditIcon sx={{ fontSize: '1rem' }} />,
            onClick: handleEdit,
          },
        ];
    return !is_private ? items.filter(item => item.label !== 'Make public') : items;
  }, [
    isPlayback,
    isPinned,
    projectId,
    isActive,
    isEditingCanvas,
    handlePin,
    handleDelete,
    handleEdit,
    onExport,
    theme.palette.background.button.primary.default,
    theme.palette.text.button.primary,
    handleMakePublic,
    is_private,
    handlePlayback,
    userId,
    author_id,
    moveToFoldersMenuItems,
    checkPermission,
  ]);

  const onMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const onMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  const onCloseMenuList = useCallback(() => {
    setShowMenu(false);
    setIsHovering(false);
  }, []);

  const onShowMenuList = useCallback(() => {
    setShowMenu(true);
  }, []);

  const onChangeConversationName = useCallback(
    event => {
      const newName = event.target.value.slice(0, MAX_CONVERSATION_LENGTH);
      setConversationName(newName);
      if (isNew) {
        onChangeActiveConversationName(newName);
      }
    },
    [isNew, onChangeActiveConversationName],
  );

  const onSave = useCallback(() => {
    onEdit({ ...conversation, name: conversationName });
    setIsEditing(false);
  }, [conversation, conversationName, onEdit]);

  const onCreate = useCallback(async () => {
    await onCreateConversation({ ...conversation, name: conversationName });
    setIsEditing(false);
  }, [conversation, conversationName, onCreateConversation]);

  const onKeyDown = useCallback(
    event => {
      if (event.key === 'Enter' && isConversationNameValid) {
        isNew ? onCreate() : onSave();
      }
    },
    [isConversationNameValid, isNew, onCreate, onSave],
  );

  const onCloseEdit = useCallback(() => {
    setConversationName(name);
    setIsEditing(false);
  }, [name]);

  // Get proper background color based on state
  const getBackgroundColor = () => {
    if (isActive) return theme.palette.background.conversation.selected;
    if (isHovering) return theme.palette.background.conversation.hover;
    return theme.palette.background.conversation.normal;
  };

  // Render the conversation content
  const renderConversationContent = () => (
    <Box
      sx={{
        border: isActive || isHovering ? '0px' : `1px solid ${theme.palette.border.conversationItemDivider}`,
        padding: '8px 12px',
        gap: '8px',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        height: '40px',
        boxSizing: 'border-box',
        background: getBackgroundColor(),
        borderTopRightRadius: isActive || isHovering ? '6px' : '0px',
        borderTopLeftRadius: isActive || isHovering ? '6px' : '0px',
        borderBottomRightRadius: isActive || isHovering ? '6px' : '0px',
        borderBottomLeftRadius: isActive || isHovering ? '6px' : '0px',
        position: 'relative',
        // Use z-index to ensure hovered item appears above adjacent items
        zIndex: isActive || isHovering ? 1 : 0,
        '&:hover #Menu': {
          visibility: 'visible',
        },
      }}
      onClick={onClickConversation}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {isPlayback && (
        <Box
          sx={{
            width: '20px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <PlayIcon sx={{ fontSize: '1rem' }} />
        </Box>
      )}
      <Box sx={{ width: mainBodyWidth }}>
        <Box sx={{ width: '100%', overflow: 'hidden' }}>
          <Typography
            sx={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpaceCollapse: 'preserve',
            }}
            component="div"
            variant="bodyMedium"
            color="text.secondary"
          >
            {name || chat_history[0]?.content || ''}
          </Typography>
        </Box>
      </Box>
      {/* Updated icon logic based on conversation type */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          gap: '6px',
          alignItems: 'center',
          minWidth: 'fit-content',
        }}
      >
        {/* Always show users icon with appropriate color based on type */}
        {conversationType === 'private_with_users' && (
          <UsersIcon
            fontSize="14px"
            fill={theme.palette.icon.fill.default}
          />
        )}
        {conversationType === 'public' && (
          <UsersIcon
            fontSize="14px"
            fill={theme.palette.status.published}
          />
        )}
        {/* Private without users shows nothing as requested */}

        {/* Pin icon */}
        {isPinned && !isPlayback && <PinIcon sx={{ fontSize: '14px' }} />}
      </Box>
      <Box
        id={'Menu'}
        sx={{
          height: '100%',
          visibility: showMenu ? 'visible' : 'hidden',
          display: isHovering || showMenu ? 'flex' : 'none',
          justifyContent: 'center',
          alignItems: 'center',
          alignSelf: 'center',
        }}
      >
        <DotMenu
          id="conversation-menu"
          slotProps={{
            ListItemText: {
              sx: { color: theme.palette.text.secondary },
              primaryTypographyProps: { variant: 'bodyMedium' },
            },
            ListItemIcon: {
              sx: {
                minWidth: '16px !important',
                marginRight: '12px',
              },
            },
          }}
          onClose={onCloseMenuList}
          onShowMenuList={onShowMenuList}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          {menuItems}
        </DotMenu>
      </Box>
    </Box>
  );

  return !isEditing ? (
    enableDragAndDrop ? (
      <DraggableConversationItem
        conversation={conversation}
        isActive={isActive}
        isDragDisabled={isDragDisabled || isEditingCanvas}
      >
        {renderConversationContent()}
      </DraggableConversationItem>
    ) : (
      renderConversationContent()
    )
  ) : (
    <Box
      sx={{
        width: '100%',
        height: '50px',
        borderRadius: '6px',
        padding: '8px 16px',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '12px',
        background: theme.palette.background.conversationEditor,
      }}
    >
      <Input.StyledInputEnhancer
        autoComplete="off"
        autoFocus
        maxRows={1}
        variant="standard"
        fullWidth
        label=""
        value={conversationName}
        onChange={onChangeConversationName}
        containerProps={{ display: 'flex', flex: 1 }}
        onKeyDown={onKeyDown}
      />
      <Tooltip
        title={isConversationNameValid ? '' : ConversationNameWarningMessage}
        placement="top"
      >
        <Box
          onClick={isConversationNameValid ? (isNew ? onCreate : onSave) : null}
          sx={{
            width: '28px',
            height: '28px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: '16px',
            cursor: isConversationNameValid ? 'pointer' : 'default',
            boxSizing: 'border-box',
            '&:hover': {
              background: isConversationNameValid ? theme.palette.background.select.hover : undefined,
            },
          }}
        >
          <CheckedIcon
            fill={
              isConversationNameValid ? theme.palette.icon.fill.default : theme.palette.icon.fill.disabled
            }
          />
        </Box>
      </Tooltip>
      <Box
        onClick={isNew ? onCancelCreate : onCloseEdit}
        sx={{
          width: '28px',
          height: '28px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: '14px',
          cursor: 'pointer',
          boxSizing: 'border-box',
          paddingTop: '2px',
          paddingLeft: '2px',
          '&:hover': {
            background: theme.palette.background.select.hover,
          },
        }}
      >
        <CancelIcon fill={theme.palette.icon.fill.default} />
      </Box>
    </Box>
  );
};

export default ConversationItem;
