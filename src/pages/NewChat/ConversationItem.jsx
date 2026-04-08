import { useCallback, useEffect, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';

import { Box, CircularProgress, Typography, useTheme } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { Input } from '@/[fsd]/shared/ui';
import CheckedIcon from '@/assets/checked-icon.svg?react';
import CopyLinkIcon from '@/assets/copy-link-icon.svg?react';
import {
  ConversationNameRegExp,
  ConversationNameWarningMessage,
  MAX_CONVERSATION_LENGTH,
  PERMISSIONS,
  PUBLIC_PROJECT_ID,
  SearchParams,
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
import useToast from '@/hooks/useToast';
import { getBasename } from '@/routes';

import DeleteIcon from '../../components/Icons/DeleteIcon';
import DraggableConversationItem from './DraggableConversationItem';

const isExportingAPIReady = false;

const ConversationItem = props => {
  const {
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
    isNextItemHovered = false,
    onItemHover,
  } = props;
  const {
    name,
    users_count = 1,
    is_private,
    chat_history = [],
    isPlayback,
    isPinned,
    isNew,
    author_id,
    isNamingPending,
  } = conversation;

  const theme = useTheme();

  const { toastInfo } = useToast();
  const { checkPermission } = useCheckPermission();
  const projectId = useSelectedProjectId();

  const { id: userId, personal_project_id } = useSelector(state => state.user);

  const [isHovering, setIsHovering] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(isNew && !isNamingPending);
  const [conversationName, setConversationName] = useState(name);

  const isConversationNameValid = useMemo(
    () => ConversationNameRegExp.test(conversationName ?? ''),
    [conversationName],
  );

  const styles = conversationItemStyles({
    isActive,
    isHovering,
    isNextItemHovered,
    showMenu,
    isConversationNameValid,
  });

  // Sync local conversationName state with the name prop when it changes
  // This ensures the edit dialog shows the correct name after auto-calculation
  useEffect(() => {
    setConversationName(name);
  }, [name]);

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
    if (!isActive) onSelectConversation(conversation);
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
    if (is_private) onEdit({ ...conversation, is_private: false });
  }, [conversation, is_private, onEdit]);

  const handlePlayback = useCallback(() => {
    onPlayback(conversation);
  }, [conversation, onPlayback]);

  const handleShareConversation = useCallback(async () => {
    const baseUrl = `${window.location.protocol}//${window.location.host}`;
    const basename = getBasename();

    const destinationUrl = `${baseUrl}${basename}/${projectId}/chat/${conversation.id}?name=${conversation.name.replaceAll(' ', '+')}&${SearchParams.SharedChat}=1`;

    await navigator.clipboard.writeText(destinationUrl);

    toastInfo('The link has been copied to the clipboard');
  }, [conversation, projectId, toastInfo]);

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
            icon: (
              <Box sx={{ svg: { path: { fill: ({ palette }) => `${palette.secondary.main} !important` } } }}>
                <EditIcon sx={{ fontSize: '1rem' }} />
              </Box>
            ),
            disabled: userId != author_id || (isActive && isEditingCanvas),
            onClick: handleEdit,
          },
          {
            label: (
              <Box
                style={{
                  display: 'flex',
                  gap: '2.25rem',
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
            display: projectId == PUBLIC_PROJECT_ID || projectId == personal_project_id ? 'none' : undefined,
            disabled: isActive && isEditingCanvas,
          },
          {
            label: 'Share',
            icon: (
              <Box sx={{ svg: { path: { fill: ({ palette }) => palette.secondary.main } } }}>
                <CopyLinkIcon />
              </Box>
            ),
            onClick: handleShareConversation,
            display: projectId == personal_project_id ? 'none' : undefined,
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
    userId,
    author_id,
    isActive,
    isEditingCanvas,
    handleDelete,
    handleEdit,
    checkPermission,
    moveToFoldersMenuItems,
    onExport,
    theme.palette.background.button.primary.default,
    theme.palette.text.button.primary,
    handleMakePublic,
    projectId,
    handleShareConversation,
    handlePlayback,
    isPinned,
    handlePin,
    personal_project_id,
    is_private,
  ]);

  const onMouseEnter = useCallback(() => {
    setIsHovering(true);
    onItemHover?.(conversation.id, true);
  }, [conversation.id, onItemHover]);

  const onMouseLeave = useCallback(() => {
    setIsHovering(false);
    onItemHover?.(conversation.id, false);
  }, [conversation.id, onItemHover]);

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

      if (isNew) onChangeActiveConversationName(newName);
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

  const renderConversationContent = () => (
    <Box
      sx={styles.conversationContentWrapper}
      onClick={onClickConversation}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {isPlayback && (
        <Box sx={styles.playbackIconWrapper}>
          <PlayIcon sx={{ fontSize: '1rem' }} />
        </Box>
      )}
      <Box sx={{ width: mainBodyWidth }}>
        <Box sx={styles.mainBody}>
          {isNamingPending && !isEditing ? (
            <Box
              data-testid="conversation-naming-spinner"
              sx={{ display: 'flex', alignItems: 'center', gap: '.375rem' }}
            >
              <CircularProgress
                size={14}
                thickness={5}
              />
              <Typography
                variant="bodySmall2"
                color="text.disabled"
              >
                Naming
              </Typography>
            </Box>
          ) : (
            <Typography
              sx={styles.nameText}
              component="div"
              variant="bodySmall2"
              color="text.secondary"
            >
              {name || chat_history[0]?.content || ''}
            </Typography>
          )}
        </Box>
      </Box>
      {/* Updated icon logic based on conversation type */}
      <Box sx={styles.conversationIconWrapper}>
        {/* Always show users icon with appropriate color based on type */}
        {conversationType === 'private_with_users' && (
          <UsersIcon
            fontSize=".875rem"
            fill={theme.palette.icon.fill.default}
          />
        )}
        {conversationType === 'public' && (
          <UsersIcon
            fontSize=".875rem"
            fill={theme.palette.status.published}
          />
        )}
        {/* Private without users shows nothing as requested */}
        {/* Pin icon */}
        {isPinned && !isPlayback && <PinIcon sx={{ fontSize: '.875rem' }} />}
      </Box>
      {!isNamingPending && (
        <Box
          id="Menu"
          sx={styles.menuWrapper}
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
                  minWidth: '1rem !important',
                  marginRight: '.75rem',
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
      )}
    </Box>
  );

  if (!isEditing)
    return enableDragAndDrop ? (
      <DraggableConversationItem
        conversation={conversation}
        isActive={isActive}
        isDragDisabled={isDragDisabled || isEditingCanvas}
      >
        {renderConversationContent()}
      </DraggableConversationItem>
    ) : (
      renderConversationContent()
    );

  return (
    <Box sx={styles.inputWrapper}>
      <Input.StyledInputEnhancer
        autoFocus
        autoComplete="off"
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
          sx={styles.checkedIconWrapper}
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
        sx={styles.cancelIconWrapper}
      >
        <CancelIcon fill={theme.palette.icon.fill.default} />
      </Box>
    </Box>
  );
};

/** @type {MuiSx} */
const conversationItemStyles = ({
  isActive,
  isHovering,
  isNextItemHovered,
  isConversationNameValid,
  showMenu,
}) => {
  const getBackgroundColor = palette => {
    if (isActive) return palette.background.conversation.selected;
    if (isHovering && !isActive) return palette.background.conversation.hover;
    return palette.background.conversation.normal;
  };

  return {
    conversationContentWrapper: ({ palette }) => ({
      borderBottom:
        isActive || isHovering || isNextItemHovered
          ? 'none'
          : `1px solid ${palette.border.conversationItemDivider}`,
      padding: '.5rem .75rem', // Reduced padding to minimize gaps
      gap: '.5rem', // Reduced gap to minimize spacing
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      height: '2.5rem', // Slightly reduced height
      boxSizing: 'border-box',
      background: getBackgroundColor(palette),
      borderTopRightRadius: isActive || isHovering ? '.375rem' : '0rem',
      borderTopLeftRadius: isActive || isHovering ? '.375rem' : '0rem',
      borderBottomRightRadius: isActive || isHovering ? '.375rem' : '0rem',
      borderBottomLeftRadius: isActive || isHovering ? '.375rem' : '0rem',
      margin: '0rem', // Remove any extra margins
      // Remove hover styles from CSS as they conflict with isHovering state

      '&:hover #Menu': {
        visibility: 'visible',
      },
    }),
    playbackIconWrapper: {
      width: '1.25rem',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '.5rem',
    },
    mainBody: { width: '100%', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: '.375rem' },
    nameText: {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpaceCollapse: 'preserve',
    },
    conversationIconWrapper: {
      display: 'flex',
      flexDirection: 'row',
      gap: '.375rem',
      alignItems: 'center',
      minWidth: 'fit-content',
    },
    menuWrapper: {
      height: '100%',
      width: isHovering ? undefined : '0px',
      visibility: showMenu ? 'visible' : 'hidden',
      display: isHovering || showMenu ? 'flex' : 'none',
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
    },
    inputWrapper: ({ palette }) => ({
      width: '100%',
      height: '3.125rem', // Reduced from 4.625rem to 3.125rem
      borderRadius: '.375rem',
      padding: '.5rem 1rem', // Reduced padding from .75rem 1rem .8125rem 1rem
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: '.75rem',
      background: palette.background.conversationEditor,
    }),
    checkedIconWrapper: ({ palette }) => ({
      width: '1.75rem',
      height: '1.75rem',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: '1rem',
      cursor: isConversationNameValid ? 'pointer' : 'default',
      boxSizing: 'border-box',

      '&:hover': {
        background: isConversationNameValid ? palette.background.select.hover : undefined,
      },
    }),
    cancelIconWrapper: ({ palette }) => ({
      width: '1.75rem',
      height: '1.75rem',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: '.875rem',
      cursor: 'pointer',
      boxSizing: 'border-box',
      paddingTop: '.125rem',
      paddingLeft: '.125rem',

      '&:hover': {
        background: palette.background.select.hover,
      },
    }),
  };
};

export default ConversationItem;
