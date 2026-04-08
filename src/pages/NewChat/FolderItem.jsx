import React, { memo, useCallback, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';

import { Box, useTheme } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import { Input } from '@/[fsd]/shared/ui';
import CheckedIcon from '@/assets/checked-icon.svg?react';
import {
  ConversationNameRegExp,
  FolderNameWarningMessage,
  MAX_CONVERSATION_LENGTH,
  PERMISSIONS,
} from '@/common/constants';
import { FolderAccordion } from '@/components/Folder/FolderAccordion.jsx';
import { FolderAccordionItem } from '@/components/Folder/FolderAccordionItem.jsx';
import CancelIcon from '@/components/Icons/CancelIcon';
import EditIcon from '@/components/Icons/EditIcon';
import ExportIcon from '@/components/Icons/ExportIcon';
import PinIcon from '@/components/Icons/PinIcon';
import useCheckPermission from '@/hooks/useCheckPermission';

import DeleteIcon from '../../components/Icons/DeleteIcon';
import DraggableFolderItem from './DraggableFolderItem';
import DroppableFolderItem from './DroppableFolderItem';

const isExportingAPIReady = false;

const FolderItem = memo(props => {
  const {
    folder = {},
    isActive = false,
    onExport,
    onChangeActiveFolderName,
    onCreateFolder,
    onCancelCreateFolder,
    onEditFolder,
    onPinFolder,
    onDeleteFolder,
    renderConversationItem,
    moveTargetConversationToNewFolder,
    cancelMovingTargetConversationToNewFolder,
    containsActiveConversation,
    enableDragAndDrop = false,
    isDropDisabled = false,
    isDragDisabled = false,
    getDropAreaState,
    isNextFolderHovered = false,
    onFolderHover,
  } = props;

  const { checkPermission } = useCheckPermission();
  const { id: userId } = useSelector(state => state.user);
  const { name, isNew: isNewFolder, owner_id } = folder;
  const [folderName, setFolderName] = useState(name);
  const isFolderNameValid = useMemo(() => ConversationNameRegExp.test(folderName ?? ''), [folderName]);
  const [isHovering, setIsHovering] = useState(false);
  const theme = useTheme();
  const [showMenu, setShowMenu] = useState(false);
  const [isFolderEditing, setIsFolderEditing] = useState(isNewFolder);
  const styles = folderItemStyles(isFolderNameValid);

  const handleDeleteFolder = useCallback(async () => {
    onDeleteFolder(folder);
  }, [folder, onDeleteFolder]);

  const handleEditFolder = useCallback(() => {
    setIsFolderEditing(true);
  }, []);

  const handlePinFolder = useCallback(() => {
    onPinFolder(folder, !folder.meta?.is_pinned);
  }, [folder, onPinFolder]);

  const menuItems = useMemo(() => {
    const items = [
      {
        label: 'Delete',
        icon: (
          <DeleteIcon
            sx={{ fontSize: '1rem' }}
            fill={theme.palette.icon.fill.default}
          />
        ),
        alertTitle: 'Delete folder?',
        confirmButtonTitle: 'Delete',
        confirmText: 'Are you sure to delete folder? It can’t be restored.',
        alarm: true,
        disabled: userId != owner_id || !checkPermission(PERMISSIONS.chat.folders.delete),
        onConfirm: handleDeleteFolder,
      },
      {
        label: 'Edit',
        icon: (
          <EditIcon
            sx={{ fontSize: '1rem' }}
            fill={theme.palette.icon.fill.default}
          />
        ),
        disabled: userId != owner_id || !checkPermission(PERMISSIONS.chat.folders.update),
        onClick: handleEditFolder,
      },
      {
        label: 'Export',
        icon: (
          <ExportIcon
            sx={{ fontSize: '1rem' }}
            fill={theme.palette.icon.fill.default}
          />
        ),
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
        onClick: handleEditFolder,
      },
      {
        label: folder.meta?.is_pinned ? 'Unpin' : 'Pin on top',
        icon: <PinIcon sx={{ fontSize: '1rem' }} />,
        disabled: userId != owner_id || !checkPermission(PERMISSIONS.chat.folders.update),
        onClick: handlePinFolder,
      },
    ];

    return items;
  }, [
    theme.palette.icon.fill.default,
    userId,
    owner_id,
    checkPermission,
    handleDeleteFolder,
    handleEditFolder,
    handlePinFolder,
    onExport,
    folder.meta?.is_pinned,
  ]);

  const onMouseEnter = useCallback(() => {
    setIsHovering(true);
    onFolderHover?.(folder.id, true);
  }, [folder.id, onFolderHover]);

  const onMouseLeave = useCallback(() => {
    setIsHovering(false);
    onFolderHover?.(folder.id, false);
  }, [folder.id, onFolderHover]);

  const onCloseMenuList = useCallback(() => {
    setShowMenu(false);
    setIsHovering(false);
  }, []);

  const onShowMenuList = useCallback(() => {
    setShowMenu(true);
  }, []);

  const onChangeFolderName = useCallback(
    event => {
      const newName = event.target.value.slice(0, MAX_CONVERSATION_LENGTH);
      setFolderName(newName);
      if (isNewFolder) {
        onChangeActiveFolderName(newName);
      }
    },
    [isNewFolder, onChangeActiveFolderName],
  );

  const handleOnSaveFolder = useCallback(() => {
    onEditFolder({ ...folder, name: folderName });
    setIsFolderEditing(false);
  }, [folder, folderName, onEditFolder]);

  const handleOnCreateFolder = useCallback(async () => {
    if (!folder.targetConversationId) {
      await onCreateFolder({ ...folder, name: folderName });
      setIsFolderEditing(false);
    } else {
      await moveTargetConversationToNewFolder({ ...folder, name: folderName });
      setIsFolderEditing(false);
    }
  }, [folder, folderName, moveTargetConversationToNewFolder, onCreateFolder]);

  const handleOnCancelCreateFolder = useCallback(async () => {
    if (!folder.targetConversationId) {
      await onCancelCreateFolder(folder);
      setIsFolderEditing(false);
    } else {
      cancelMovingTargetConversationToNewFolder(folder);
      await onCancelCreateFolder(folder);
    }
  }, [cancelMovingTargetConversationToNewFolder, folder, onCancelCreateFolder]);

  const handleOnKeyDownFolder = useCallback(
    event => {
      if (event.key === 'Enter' && isFolderNameValid) {
        isNewFolder ? handleOnCreateFolder() : handleOnSaveFolder();
      }
    },
    [isFolderNameValid, isNewFolder, handleOnCreateFolder, handleOnSaveFolder],
  );

  const handleOnCloseEditFolder = useCallback(() => {
    setFolderName(name);
    setIsFolderEditing(false);
  }, [name]);

  const renderFolderAccordion = useCallback(
    () => (
      <FolderAccordion
        menuItems={menuItems}
        isActive={isActive}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onShowMenuList={onShowMenuList}
        onCloseMenuList={onCloseMenuList}
        isHovering={isHovering}
        isNextFolderHovered={isNextFolderHovered}
        showMenu={showMenu}
        showMode={AccordionConstants.AccordionShowMode.LeftMode}
        defaultExpanded={containsActiveConversation}
        isPinned={folder.meta?.is_pinned}
        items={[
          {
            title: name || '',
            content: (
              <FolderAccordionItem
                folder={folder}
                renderConversationItem={renderConversationItem}
              />
            ),
          },
        ]}
        slotProps={styles.slotProps}
      />
    ),
    [
      menuItems,
      isActive,
      onMouseEnter,
      onMouseLeave,
      onShowMenuList,
      onCloseMenuList,
      isHovering,
      isNextFolderHovered,
      showMenu,
      containsActiveConversation,
      folder,
      name,
      renderConversationItem,
      styles.slotProps,
    ],
  );

  return !isFolderEditing ? (
    <>
      {enableDragAndDrop ? (
        <DraggableFolderItem
          folder={folder}
          isDragDisabled={isDragDisabled}
        >
          <DroppableFolderItem
            folder={folder}
            isDropDisabled={isDropDisabled}
            {...(getDropAreaState
              ? getDropAreaState(`folder-${folder.id}`)
              : { isValidDropTarget: true, isActive: true })}
          >
            {renderFolderAccordion()}
          </DroppableFolderItem>
        </DraggableFolderItem>
      ) : (
        renderFolderAccordion()
      )}
    </>
  ) : (
    <Box sx={styles.editorContainer}>
      <Input.StyledInputEnhancer
        autoComplete="off"
        autoFocus
        maxRows={1}
        variant="standard"
        fullWidth
        label=""
        value={folderName}
        onChange={onChangeFolderName} //splice
        containerProps={{ display: 'flex', flex: 1 }}
        onKeyDown={handleOnKeyDownFolder}
      />
      <Tooltip
        title={isFolderNameValid ? '' : FolderNameWarningMessage}
        placement="top"
      >
        <Box
          onClick={isFolderNameValid ? (isNewFolder ? handleOnCreateFolder : handleOnSaveFolder) : null}
          sx={styles.checkButton}
        >
          <CheckedIcon
            fill={isFolderNameValid ? theme.palette.icon.fill.default : theme.palette.icon.fill.disabled}
          />
        </Box>
      </Tooltip>
      <Box
        onClick={isNewFolder ? handleOnCancelCreateFolder : handleOnCloseEditFolder}
        sx={styles.cancelButton}
      >
        <CancelIcon fill={theme.palette.icon.fill.default} />
      </Box>
    </Box>
  );
});

/** @type {MuiSx} */
const folderItemStyles = isFolderNameValid => ({
  slotProps: {
    summary: {
      sx: {
        padding: '0 0.25rem !important',
      },
    },
    summaryContainer: {
      sx: {
        padding: '0.375rem 0.25rem !important',
        height: '2.5625rem',
      },
    },
    detail: {
      sx: {
        paddingLeft: '1rem !important',
      },
    },
    sx: ({ palette }) => ({
      background: `${palette.background.tabPanel} !important`,
    }),
  },
  editorContainer: ({ palette }) => ({
    width: '100%',
    height: '3.125rem',
    borderRadius: '0.375rem',
    padding: '0.5rem 1rem',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '0.75rem',
    background: palette.background.conversationEditor,
  }),
  checkButton: ({ palette }) => ({
    width: '1.75rem',
    height: '1.75rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '1rem',
    cursor: isFolderNameValid ? 'pointer' : 'default',
    boxSizing: 'border-box',
    '&:hover': {
      background: isFolderNameValid ? palette.background.select.hover : undefined,
    },
  }),
  cancelButton: ({ palette }) => ({
    width: '1.75rem',
    height: '1.75rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '0.875rem',
    cursor: 'pointer',
    boxSizing: 'border-box',
    paddingTop: '0.125rem',
    paddingLeft: '0.125rem',
    '&:hover': {
      background: palette.background.select.hover,
    },
  }),
});

FolderItem.displayName = 'FolderItem';

export default FolderItem;
