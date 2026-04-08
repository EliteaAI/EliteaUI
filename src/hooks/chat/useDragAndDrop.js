import { useCallback, useState } from 'react';

import { POSITION_GAP } from '@/common/constants';
import { KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';

const folderIdMatches = (folder, id) => String(folder.id) === String(id) || folder.id === parseInt(id, 10);

const computePositionBetweenNeighbors = (posAbove, posBelow) => {
  if (posAbove != null && posBelow != null) return Math.floor((posAbove + posBelow) / 2);
  if (posAbove != null) return Math.floor(posAbove / 2);
  if (posBelow != null) return posBelow + POSITION_GAP;
  return 0;
};

const computePositionAtTopOfUnpinned = (posAbove, posBelow) => {
  if (posBelow != null) return posBelow + POSITION_GAP;
  if (posAbove != null) return posAbove + POSITION_GAP;
  return 0;
};

const useDragAndDrop = ({
  onMoveToFolderConversation,
  onReorderFolders,
  folders,
  originalFolders,
  conversations,
  selectedConversations = [],
  toastSuccess,
  toastError,
}) => {
  const foldersForReordering = originalFolders || folders;
  const [activeId, setActiveId] = useState(null);
  const [draggedItems, setDraggedItems] = useState([]);
  const [draggedFromFolder, setDraggedFromFolder] = useState(null);
  const [draggedFolder, setDraggedFolder] = useState(null);
  const [isDraggingFolder, setIsDraggingFolder] = useState(false);

  const calculatePositionForDraggedFolder = useCallback((foldersForReorder, draggedFolderId) => {
    const draggedFolderIndex = foldersForReorder.findIndex(f => String(f.id) === String(draggedFolderId));

    if (draggedFolderIndex === -1) return foldersForReorder;

    const draggedFold = foldersForReorder[draggedFolderIndex];
    if (draggedFold.isNew) return foldersForReorder;

    const prevNonNewFolder = foldersForReorder
      .slice(0, draggedFolderIndex)
      .reverse()
      .find(f => !f.isNew);
    const nextNonNewFolder = foldersForReorder.slice(draggedFolderIndex + 1).find(f => !f.isNew);

    const neighborAboveId = prevNonNewFolder?.id ?? null;
    const neighborBelowId = nextNonNewFolder?.id ?? null;

    const posAbove = prevNonNewFolder?.position;
    const posBelow = nextNonNewFolder?.position;
    const newPosition = computePositionBetweenNeighbors(posAbove, posBelow);

    return foldersForReorder.map((folder, index) =>
      index === draggedFolderIndex
        ? {
            ...folder,
            position: newPosition,
            neighbor_above_id: neighborAboveId,
            neighbor_below_id: neighborBelowId,
          }
        : folder,
    );
  }, []);

  const calculatePositionWhenDroppedOnPinned = useCallback((foldersList, draggedFolderId) => {
    const pinnedInOrder = foldersList.filter(f => f.meta?.is_pinned);
    const lastPinned = pinnedInOrder[pinnedInOrder.length - 1] ?? null;
    const otherUnpinned = foldersList.filter(
      f => !f.meta?.is_pinned && String(f.id) !== String(draggedFolderId),
    );
    const firstUnpinned = otherUnpinned[0] ?? null;

    const neighborAboveId = lastPinned?.id ?? null;
    const neighborBelowId = firstUnpinned?.id ?? null;
    const posAbove = lastPinned?.position;
    const posBelow = firstUnpinned?.position;
    const newPosition = computePositionAtTopOfUnpinned(posAbove, posBelow);

    const draggedFolderItem = foldersList.find(f => folderIdMatches(f, draggedFolderId));
    if (!draggedFolderItem) return foldersList;

    const draggedWithNewPosition = {
      ...draggedFolderItem,
      position: newPosition,
      neighbor_above_id: neighborAboveId,
      neighbor_below_id: neighborBelowId,
    };

    return [...pinnedInOrder, draggedWithNewPosition, ...otherUnpinned];
  }, []);

  const computeFoldersOrderForDrop = useCallback(
    (foldersList, draggedId, fromIndex, toIndex, targetPinned, draggedUnpinned) => {
      if (targetPinned && draggedUnpinned) {
        return calculatePositionWhenDroppedOnPinned(foldersList, draggedId);
      }
      const reordered = arrayMove(foldersList, fromIndex, toIndex);
      return calculatePositionForDraggedFolder(reordered, draggedId);
    },
    [calculatePositionForDraggedFolder, calculatePositionWhenDroppedOnPinned],
  );

  const handleFolderReordering = useCallback(
    async (over, active) => {
      const dropTargetId = over.id;
      const isDroppedOnFolder = typeof dropTargetId === 'string' && dropTargetId.startsWith('folder-');
      const isDroppedOnSelf = active.id === dropTargetId;

      if (!isDroppedOnFolder || isDroppedOnSelf) {
        return;
      }

      const targetIdFromOver = dropTargetId.replace('folder-', '');
      const targetFolder =
        folders.find(f => folderIdMatches(f, targetIdFromOver)) ?? over.data?.current?.folder;
      const draggedFolderId = active.id.replace('folder-', '');
      const draggedFolderData = folders.find(f => folderIdMatches(f, draggedFolderId));

      const folderIdsForReordering = folders.map(folder => `folder-${folder.id}`);
      const draggedFolderIndex = folderIdsForReordering.indexOf(active.id);
      const targetFolderIndex = folderIdsForReordering.indexOf(dropTargetId);

      const areBothIndicesValid = draggedFolderIndex !== -1 && targetFolderIndex !== -1;
      if (!areBothIndicesValid || !draggedFolderData) return;

      const foldersToSubmit = computeFoldersOrderForDrop(
        folders,
        draggedFolderId,
        draggedFolderIndex,
        targetFolderIndex,
        targetFolder?.meta?.is_pinned,
        !draggedFolderData.meta?.is_pinned,
      );
      await onReorderFolders(foldersToSubmit);
    },
    [folders, computeFoldersOrderForDrop, onReorderFolders],
  );

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px minimum drag distance to activate
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = useCallback(
    event => {
      const { active } = event;
      setActiveId(active.id);

      if (typeof active.id === 'string' && active.id.startsWith('folder-')) {
        const folderId = active.id.replace('folder-', '');
        const draggedFolderObj = folders.find(f => folderIdMatches(f, folderId));

        if (draggedFolderObj) {
          setIsDraggingFolder(true);
          setDraggedFolder(draggedFolderObj);
          setDraggedItems([]);
          setDraggedFromFolder(null);
          return;
        }
      }

      setIsDraggingFolder(false);
      setDraggedFolder(null);

      const draggedConversation =
        conversations.find(conv => conv.id === active.id) ||
        foldersForReordering
          .flatMap(folder => folder.conversations || [])
          .find(conv => conv.id === active.id);

      if (!draggedConversation) {
        return;
      }

      // Determine which conversations to drag
      let conversationsToDrag = [];
      const isSelected = selectedConversations.some(selected => selected.id === draggedConversation.id);

      if (isSelected && selectedConversations.length > 1) {
        // If the dragged conversation is part of selected conversations, drag all selected
        conversationsToDrag = selectedConversations;
      } else {
        // Otherwise, just drag the single conversation
        conversationsToDrag = [draggedConversation];
      }

      // Determine the source folder for contextual drop areas
      const sourceFolder = draggedConversation.folder_id
        ? foldersForReordering.find(folder => folder.id === draggedConversation.folder_id)
        : null;

      setDraggedItems(conversationsToDrag);
      setDraggedFromFolder(sourceFolder);
    },
    [conversations, folders, selectedConversations, foldersForReordering],
  );

  const handleDragEnd = useCallback(
    async event => {
      const { over, active } = event;

      const hasStateMismatch = activeId !== null && active.id !== activeId;
      if (hasStateMismatch) {
        setActiveId(null);
        setDraggedItems([]);
        setDraggedFromFolder(null);
        setDraggedFolder(null);
        setIsDraggingFolder(false);
        return;
      }

      const currentDraggedItems = [...draggedItems];
      const wasDraggingFolder = isDraggingFolder;
      const currentDraggedFolder = draggedFolder;

      setActiveId(null);
      setDraggedItems([]);
      setDraggedFromFolder(null);
      setDraggedFolder(null);
      setIsDraggingFolder(false);

      if (!over) {
        return;
      }

      const shouldHandleFolderReordering = wasDraggingFolder && currentDraggedFolder && onReorderFolders;

      if (shouldHandleFolderReordering) {
        await handleFolderReordering(over, active);
        return;
      }

      if (currentDraggedItems.length === 0) {
        return;
      }

      const droppedOnId = over.id;
      let successCount = 0;
      let targetLocation = '';

      try {
        if (droppedOnId.startsWith('folder-')) {
          const folderId = droppedOnId.replace('folder-', '');
          const targetFolder = folders.find(f => folderIdMatches(f, folderId));

          if (!targetFolder) return;

          targetLocation = `"${targetFolder.name}" folder`;

          for (const conversation of currentDraggedItems) {
            if (conversation.isPlayback) continue;
            const hasPlaybacks =
              conversations.some(conv => conv.isPlayback && conv.id === conversation.id) ||
              foldersForReordering.some(folder =>
                (folder.conversations || []).some(conv => conv.isPlayback && conv.id === conversation.id),
              );
            if (hasPlaybacks) continue;

            if (String(conversation.folder_id) !== String(targetFolder.id)) {
              try {
                await onMoveToFolderConversation(conversation, targetFolder);
                successCount++;
              } catch {
                toastError('Error moving conversations');
              }
            }
          }
        } else if (droppedOnId === 'ungrouped-conversations') {
          targetLocation = 'ungrouped area';

          for (const conversation of currentDraggedItems) {
            if (conversation.isPlayback) continue;
            const hasPlaybacks =
              conversations.some(conv => conv.isPlayback && conv.id === conversation.id) ||
              foldersForReordering.some(folder =>
                (folder.conversations || []).some(conv => conv.isPlayback && conv.id === conversation.id),
              );
            if (hasPlaybacks) continue;

            if (conversation.folder_id) {
              try {
                await onMoveToFolderConversation(conversation, null);
                successCount++;
              } catch {
                toastError('Error moving conversations');
              }
            }
          }
        }

        if (successCount > 0 && toastSuccess && currentDraggedItems.length > 1) {
          const message =
            successCount === 1
              ? `1 conversation moved to ${targetLocation} successfully`
              : `${successCount} conversations moved to ${targetLocation} successfully`;
          toastSuccess(message);
        }
      } catch {
        toastError('Error moving conversations');
      }
    },
    [
      activeId,
      draggedItems,
      draggedFolder,
      isDraggingFolder,
      folders,
      conversations,
      onMoveToFolderConversation,
      onReorderFolders,
      foldersForReordering,
      toastSuccess,
      toastError,
      handleFolderReordering,
    ],
  );

  const handleDragOver = useCallback(() => {}, []);

  const isDragging = activeId !== null;

  // Contextual drop area logic
  const getDropAreaState = useCallback(
    dropAreaId => {
      if (!isDragging) {
        return { isValidDropTarget: false, isActive: false };
      }

      if (isDraggingFolder && draggedFolder) {
        if (dropAreaId.startsWith('folder-')) {
          const folderId = dropAreaId.replace('folder-', '');

          const isValidDropTarget =
            String(draggedFolder.id) !== folderId && draggedFolder.id !== parseInt(folderId);

          return {
            isValidDropTarget,
            isActive: isValidDropTarget,
          };
        }

        return { isValidDropTarget: false, isActive: false };
      }

      if (draggedItems.length === 0) {
        return { isValidDropTarget: false, isActive: false };
      }

      const isDroppingFromFolder = draggedFromFolder !== null;
      const isDroppingFromUngrouped = draggedFromFolder === null;

      if (dropAreaId === 'ungrouped-conversations') {
        // Ungrouped area is valid if dragging from a folder
        return {
          isValidDropTarget: isDroppingFromFolder,
          isActive: isDroppingFromFolder,
        };
      }

      if (dropAreaId.startsWith('folder-')) {
        const folderId = dropAreaId.replace('folder-', '');

        // Folder is valid if:
        // 1. Dragging from ungrouped, OR
        // 2. Dragging from a different folder
        const isValidDropTarget =
          isDroppingFromUngrouped || (isDroppingFromFolder && draggedFromFolder.id !== folderId);

        return {
          isValidDropTarget,
          isActive: isValidDropTarget,
        };
      }

      return { isValidDropTarget: false, isActive: false };
    },
    [isDragging, draggedItems, draggedFromFolder, isDraggingFolder, draggedFolder],
  );

  return {
    sensors,
    activeId,
    draggedItems,
    draggedFromFolder,
    isDragging,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    getDropAreaState,
  };
};

export default useDragAndDrop;
