import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Box, CircularProgress, ClickAwayListener, Typography, useTheme } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { SHARE_MESSAGES } from '@/[fsd]/features/chat/conversation-list/lib/constants';
import { useCopyChatLink } from '@/[fsd]/features/chat/conversation-list/lib/hooks';
import {
  ConversationRunIndicator,
  DraggableConversationItem,
} from '@/[fsd]/features/chat/conversation-list/ui';
import { ChatRightsConstants } from '@/[fsd]/features/chat/lib/constants';
import { useChatRights, useConversationRunStatus } from '@/[fsd]/features/chat/lib/hooks';
import { NavigationHelpers } from '@/[fsd]/shared/lib/helpers';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { AppLink, Button, Input } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import CheckedIcon from '@/assets/checked-icon.svg?react';
import ShareIcon from '@/assets/share-icon.svg?react';
import {
  ConversationNameRegExp,
  ConversationNameWarningMessage,
  MAX_CONVERSATION_LENGTH,
  PERMISSIONS,
  SearchParams,
} from '@/common/constants';
import DotMenu from '@/components/DotMenu';
import ArrowRightIcon from '@/components/Icons/ArrowRightIcon.jsx';
import CancelIcon from '@/components/Icons/CancelIcon';
import CopyIcon from '@/components/Icons/CopyIcon';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import EditIcon from '@/components/Icons/EditIcon';
import ExportIcon from '@/components/Icons/ExportIcon';
import MoveTo from '@/components/Icons/MoveTo';
import PinIcon from '@/components/Icons/PinIcon';
import PlayIcon from '@/components/Icons/PlayIcon';
import UsersIcon from '@/components/Icons/UsersIcon';
import useCheckPermission from '@/hooks/useCheckPermission';
import RouteDefinitions from '@/routes';

const ConversationItem = memo(props => {
  const {
    conversation = {},
    onSelectConversation,
    isActive = false,
    onDelete,
    onEdit,
    onPlayback,
    onPin,
    onDuplicate,
    isDuplicating,
    onExport,
    onCreateConversation,
    onCancelCreate,
    onChangeActiveConversationName,
    getMoveToFoldersMenuItems,
    isEditingCanvas,
    enableDragAndDrop = false,
    isDragDisabled = false,
    onShare,
    showChatPageActions = true,
  } = props;
  const {
    name,
    users_count = 1,
    is_private,
    chat_history = [],
    isPlayback,
    isPinned,
    isNew,
    isNamingPending,
  } = conversation;

  const theme = useTheme();

  const { checkPermission } = useCheckPermission();
  const projectId = useSelectedProjectId();
  const { isRunning, unread } = useConversationRunStatus(projectId, conversation);
  const rights = useChatRights(conversation);
  const { SHARE_ACTIONS } = ChatRightsConstants;
  // The open chat shows its own run; the row only speaks for chats that are not on screen
  const showRunIndicator = !isPlayback && !isNew && (isRunning || (!!unread && !isActive));

  const [isHovering, setIsHovering] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(isNew && !isNamingPending);
  const [conversationName, setConversationName] = useState(name);
  const isConversationNameValid = useMemo(
    () => ConversationNameRegExp.test(conversationName ?? ''),
    [conversationName],
  );

  const isSaveEnabled = useMemo(
    () => isConversationNameValid && (isNew || conversationName !== name),
    [isConversationNameValid, isNew, conversationName, name],
  );

  const styles = conversationItemStyles({
    isActive,
    isHovering,
    showMenu,
    isSaveEnabled,
    isDuplicating,
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

  // A real link (href) lets the browser offer "Open link in new tab"; drafts and playbacks have no page of their own
  const conversationLinkProps = useMemo(() => {
    if (isNew || isPlayback || typeof conversation.id !== 'number') return {};
    return {
      component: AppLink,
      to: {
        pathname: NavigationHelpers.buildRoute(RouteDefinitions.ChatConversation, {
          conversationId: conversation.id,
        }),
        search: name ? `?${new URLSearchParams({ [SearchParams.Name]: name })}` : '',
      },
      // A native link drag would compete with the drag-and-drop of the row
      draggable: false,
    };
  }, [conversation.id, isNew, isPlayback, name]);

  const onClickConversation = useCallback(
    event => {
      // The link is only a carrier for the href; a plain click keeps the existing selection logic
      event?.preventDefault?.();
      if (!isActive) onSelectConversation(conversation);
    },
    [conversation, isActive, onSelectConversation],
  );

  const handlePin = useCallback(async () => {
    onPin(conversation, !isPinned);
  }, [conversation, isPinned, onPin]);

  const handleUnpinClick = useCallback(
    event => {
      // The row is a link, so the click must not follow it
      event.preventDefault();
      event.stopPropagation();
      onPin(conversation, false);
    },
    [conversation, onPin],
  );

  const handleDelete = useCallback(async () => {
    onDelete(conversation);
  }, [conversation, onDelete]);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handlePlayback = useCallback(() => {
    onPlayback(conversation);
  }, [conversation, onPlayback]);

  const handleDuplicate = useCallback(() => {
    onDuplicate(conversation);
  }, [conversation, onDuplicate]);

  const handleExport = useCallback(() => {
    onExport?.(conversation);
  }, [conversation, onExport]);

  const copyChatLink = useCopyChatLink();

  // The owner and a manager get the Share window; anyone else gets the chat link (#7757)
  const handleShare = useCallback(() => {
    if (rights.shareAction === SHARE_ACTIONS.window && onShare) onShare(conversation);
    else copyChatLink(conversation, SHARE_MESSAGES.saved);
  }, [SHARE_ACTIONS.window, conversation, copyChatLink, onShare, rights.shareAction]);

  const menuItems = useMemo(() => {
    return !isPlayback
      ? [
          {
            key: 'chat-conversation-menu-rename',
            label: 'Rename',
            icon: (
              <Box sx={{ svg: { path: { fill: ({ palette }) => `${palette.secondary.main} !important` } } }}>
                <EditIcon sx={{ fontSize: '1rem' }} />
              </Box>
            ),
            disabled: !rights.canManage || (isActive && isEditingCanvas),
            onClick: handleEdit,
          },
          {
            key: 'chat-conversation-menu-move-to',
            label: (
              <Box sx={conversationItemMenuStyles().moveToLabel}>
                <Box>Move to</Box>
                <ArrowRightIcon />
              </Box>
            ),
            icon: <MoveTo sx={{ fontSize: '1rem' }} />,
            hasSubMenu: true,
            disabled:
              isPinned ||
              !rights.canMoveToFolder ||
              !checkPermission(PERMISSIONS.chat.folders.create) ||
              !checkPermission(PERMISSIONS.chat.folders.update) ||
              (isActive && isEditingCanvas),
            // Built only while the menu is open, so a closed row stays memoized
            subMenuItems: showMenu ? (getMoveToFoldersMenuItems?.(conversation) ?? []) : [],
          },
          // Playback and Duplicate open the chat, so they are offered on the chat page only
          ...(showChatPageActions
            ? [
                {
                  key: 'chat-conversation-menu-playback',
                  label: 'Playback',
                  icon: <PlayIcon sx={{ fontSize: '1rem' }} />,
                  disabled: isActive && isEditingCanvas,
                  onClick: handlePlayback,
                },
                {
                  label: 'Duplicate',
                  icon: <CopyIcon sx={{ fontSize: '1rem' }} />,
                  disabled: !rights.canManage || (isActive && isEditingCanvas),
                  onClick: handleDuplicate,
                },
              ]
            : []),
          {
            key: 'chat-conversation-menu-export',
            label: 'Export',
            icon: <ExportIcon sx={{ fontSize: '1rem' }} />,
            disabled: !rights.canManage || (isActive && isEditingCanvas),
            onClick: handleExport,
          },
          ...(rights.shareAction !== SHARE_ACTIONS.none
            ? [
                {
                  key: 'chat-conversation-menu-share',
                  label: 'Share',
                  icon: (
                    <Box sx={{ svg: { path: { fill: ({ palette }) => palette.secondary.main } } }}>
                      <ShareIcon />
                    </Box>
                  ),
                  onClick: handleShare,
                },
              ]
            : []),
          {
            key: 'chat-conversation-menu-pin',
            label: isPinned ? 'Unpin' : 'Pin on top',
            icon: <PinIcon sx={{ fontSize: '1rem' }} />,
            disabled: !isPinned && !!conversation.folder_id,
            onClick: handlePin,
          },
          {
            key: 'chat-conversation-menu-delete',
            label: 'Delete',
            icon: <DeleteIcon sx={{ fontSize: '1rem' }} />,
            entityName: name,
            inlineExtraContent: " chat? It can't be restored.",
            shouldRequestInputName: false,
            alarm: true,
            disabled: !rights.canDelete || (isActive && isEditingCanvas),
            onConfirm: handleDelete,
          },
        ]
      : [
          {
            label: 'Delete',
            icon: <DeleteIcon sx={{ fontSize: '1rem' }} />,
            entityName: name?.replace(/^\[Playback\]\s*/, ''),
            inlineExtraContent: ' chat playback?',
            shouldRequestInputName: false,
            alarm: true,
            onConfirm: handleDelete,
          },
          {
            label: 'Rename',
            icon: <EditIcon sx={{ fontSize: '1rem' }} />,
            onClick: handleEdit,
          },
        ];
  }, [
    isPlayback,
    rights,
    SHARE_ACTIONS.none,
    isActive,
    isEditingCanvas,
    handleDelete,
    handleEdit,
    handleDuplicate,
    handleExport,
    isPinned,
    checkPermission,
    getMoveToFoldersMenuItems,
    showMenu,
    conversation,
    handleShare,
    handlePlayback,
    handlePin,
    name,
    showChatPageActions,
  ]);

  const onMouseEnter = useCallback(() => setIsHovering(true), []);

  const onMouseLeave = useCallback(() => setIsHovering(false), []);

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
      if (event.key === 'Enter' && isSaveEnabled) {
        isNew ? onCreate() : onSave();
      }
    },
    [isSaveEnabled, isNew, onCreate, onSave],
  );

  const onCloseEdit = useCallback(() => {
    setConversationName(name);
    setIsEditing(false);
  }, [name]);

  const renderConversationContent = () => (
    <Box
      {...conversationLinkProps}
      data-testid={`chat-conversation-item-${conversation.id}`}
      data-active={isActive ? 'true' : 'false'}
      data-pinned={isPinned ? 'true' : 'false'}
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
      <Box sx={styles.nameColumn}>
        <Box sx={styles.mainBody}>
          {isNamingPending && !isEditing ? (
            <Box
              data-testid="conversation-naming-spinner"
              sx={conversationItemMenuStyles().namingSpinner}
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
      <Box
        data-testid="conversation-multi-user-icon"
        data-has-icon={conversationType === 'private_with_users' || conversationType === 'public'}
        sx={styles.conversationIconWrapper}
      >
        {showRunIndicator && (
          <ConversationRunIndicator
            isRunning={isRunning}
            unread={isActive ? null : unread}
          />
        )}
        {/* Always show users icon with appropriate color based on type */}
        {conversationType === 'private_with_users' && (
          <UsersIcon
            fontSize=".875rem"
            fill={theme.palette.icon.default}
          />
        )}
        {conversationType === 'public' && (
          <UsersIcon
            fontSize=".875rem"
            fill={theme.palette.icon.success}
          />
        )}
        {/* Private without users shows nothing as requested */}
        {/* Pin icon */}
        {isPinned && !isPlayback && (
          <Tooltip
            title="Unpin"
            placement="top"
          >
            <Button.BaseBtn
              variant={BUTTON_VARIANTS.tertiary}
              data-testid="chat-pin-icon"
              aria-label="Unpin chat"
              onClick={handleUnpinClick}
              startIcon={<PinIcon sx={styles.pinIcon} />}
              sx={styles.pinButton}
            />
          </Tooltip>
        )}
      </Box>
      {!isNamingPending && (
        <Box
          id="Menu"
          sx={styles.menuWrapper}
          // Capture phase: the menu button stops propagation, so a bubbling handler would never see the click
          onClickCapture={NavigationHelpers.preventLinkFollow}
        >
          {isDuplicating ? (
            <CircularProgress
              size={16}
              thickness={5}
            />
          ) : (
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
          )}
        </Box>
      )}
    </Box>
  );

  if (!isEditing)
    return enableDragAndDrop ? (
      <DraggableConversationItem
        conversation={conversation}
        isActive={isActive}
        isDragDisabled={isDragDisabled || isEditingCanvas || !rights.canMoveToFolder}
      >
        {renderConversationContent()}
      </DraggableConversationItem>
    ) : (
      renderConversationContent()
    );

  return (
    <ClickAwayListener
      mouseEvent="onMouseDown"
      onClickAway={isNew ? onCancelCreate : onCloseEdit}
    >
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
            onClick={isSaveEnabled ? (isNew ? onCreate : onSave) : null}
            sx={styles.checkedIconWrapper}
          >
            <CheckedIcon fill={isSaveEnabled ? theme.palette.icon.default : theme.palette.icon.disabled} />
          </Box>
        </Tooltip>
        <Box
          onClick={isNew ? onCancelCreate : onCloseEdit}
          sx={styles.cancelIconWrapper}
        >
          <CancelIcon fill={theme.palette.icon.default} />
        </Box>
      </Box>
    </ClickAwayListener>
  );
});

ConversationItem.displayName = 'ConversationItem';

/** @type {MuiSx} */
const conversationItemStyles = ({ isActive, isHovering, isDuplicating, isSaveEnabled, showMenu }) => {
  const getBackgroundColor = palette => {
    if (isActive) return palette.components.conversation.background.selected;
    if (isHovering && !isActive) return palette.components.conversation.background.hover;
    return palette.components.conversation.background.normal;
  };

  return {
    conversationContentWrapper: ({ palette }) => ({
      padding: '.25rem .75rem',
      gap: '.5rem',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      height: '2.25rem',
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
    // The name takes what the icons leave, so the icons keep one column however long the name is
    nameColumn: { flex: 1, minWidth: 0 },
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
      flexShrink: 0,
    },
    pinButton: ({ palette }) => ({
      minWidth: '1.25rem !important',
      width: '1.25rem',
      height: '1.25rem',
      padding: '0 !important',
      '&:hover path': {
        fill: palette.icon.secondary,
      },
    }),
    pinIcon: {
      fontSize: '.875rem',
    },
    menuWrapper: {
      height: '100%',
      width: isHovering || isDuplicating ? undefined : 0,
      visibility: showMenu || isDuplicating ? 'visible' : 'hidden',
      display: isHovering || showMenu || isDuplicating ? 'flex' : 'none',
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      flexShrink: 0,
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
      background: palette.components.conversation.background.editor,
    }),
    checkedIconWrapper: ({ palette }) => ({
      width: '1.75rem',
      height: '1.75rem',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: '1rem',
      cursor: isSaveEnabled ? 'pointer' : 'default',
      boxSizing: 'border-box',

      '&:hover': {
        background: isSaveEnabled ? palette.background.interactiveItem.hover : undefined,
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
        background: palette.background.interactiveItem.hover,
      },
    }),
  };
};

// Used inside the memoized menu definition, so it must not depend on per-render styles.
/** @type {MuiSx} */
const conversationItemMenuStyles = () => ({
  namingSpinner: {
    display: 'flex',
    alignItems: 'center',
    gap: '.375rem',
  },
  moveToLabel: {
    display: 'flex',
    gap: '2.25rem',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export default ConversationItem;
