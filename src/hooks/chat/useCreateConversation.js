import { useCallback, useEffect, useRef, useState } from 'react';

import { useDispatch } from 'react-redux';

import { useTrackEvent } from '@/GA';
import { sortConversations } from '@/[fsd]/features/chat/conversation-list/lib/helpers';
import { useConversationNavigation } from '@/[fsd]/features/chat/lib/hooks';
import { AnalyticConstants } from '@/[fsd]/shared/lib/constants';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import {
  useConversationCreateMutation,
  useConversationEditMutation,
  useSelectConversationMutation,
} from '@/api';
import { DefaultConversationName, dummyConversation } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils';
import { actions as chatActions } from '@/slices/chat';

import useResetCreateFlag from './useResetCreateFlag';

const { GA_EVENT_NAMES, GA_EVENT_PARAMS } = AnalyticConstants;

export default function useCreateConversation({
  activeConversation,
  selectionCountRef,
  setActiveConversation,
  setConversations,
  setFolders,
  emitEnterRoom,
  emitLeaveRoom,
  toastError,
  setActiveParticipant,
  listenCanvasEditorsChangeEvent,
  stopListenCanvasEditorsChangeEvent,
  listenCanvasContentChangeEvent,
  stopListenCanvasContentChangeEvent,
}) {
  const dispatch = useDispatch();
  const projectId = useSelectedProjectId();
  const trackEvent = useTrackEvent();
  const { resetCreateFlag } = useResetCreateFlag();
  const { changeUrlByConversation } = useConversationNavigation();
  const [pendingEnterRoomEvent, setPendingEnterRoomEvent] = useState();
  const [createConversation, { isError: isCreateError, error: createError }] =
    useConversationCreateMutation();
  const [editConversation] = useConversationEditMutation();
  const [selectConversation, { isError: isSelectConversationError, error: selectConversationError }] =
    useSelectConversationMutation();

  // The user may leave a chat while it is being created; the create chain must not pull them back
  const activeConversationRef = useRef(activeConversation);
  const isMountedRef = useRef(true);
  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  const isConversationOnScreen = useCallback(
    (...ids) => isMountedRef.current && ids.some(id => id && activeConversationRef.current?.id === id),
    [],
  );

  const updateFolderConversations = useCallback(
    (folderId, getNextConversations) => {
      setFolders(prev =>
        prev.map(folder =>
          folder.id === folderId
            ? { ...folder, conversations: getNextConversations(folder.conversations || []) }
            : folder,
        ),
      );
    },
    [setFolders],
  );

  // Folder assignment failed but the conversation exists — keep it visible in the ungrouped list
  const fallbackToUngrouped = useCallback(
    (folderId, createdConversation) => {
      updateFolderConversations(folderId, prev => prev.filter(c => !c.isNew));
      setConversations(prev =>
        sortConversations([
          { ...createdConversation, folder_id: null },
          ...prev.filter(c => !c.isNew && c.id !== createdConversation.id),
        ]),
      );
      setActiveConversation(prev =>
        prev?.id === createdConversation.id ? { ...prev, folder_id: null } : prev,
      );
    },
    [setActiveConversation, setConversations, updateFolderConversations],
  );

  // Files a created chat into its folder (or the ungrouped list), replacing the entries isReplaced matches
  const fileCreatedConversation = useCallback(
    async (folderId, createdConversation, isReplaced) => {
      if (folderId && setFolders) {
        const editResult = await editConversation({
          projectId,
          id: createdConversation.id,
          folder_id: folderId,
        });
        if (editResult.error) {
          toastError(buildErrorMessage(editResult.error));
          fallbackToUngrouped(folderId, createdConversation);
        } else {
          updateFolderConversations(folderId, prev =>
            sortConversations([
              { ...createdConversation, folder_id: folderId },
              ...prev.filter(c => !isReplaced(c)),
            ]),
          );
        }
      } else {
        setConversations(prev =>
          sortConversations([...prev.filter(c => !isReplaced(c)), createdConversation]),
        );
      }
    },
    [
      editConversation,
      fallbackToUngrouped,
      projectId,
      setConversations,
      setFolders,
      toastError,
      updateFolderConversations,
    ],
  );

  const onCreateConversation = useCallback(
    async (newConversation, onCreatedCallback, shouldSetActiveAfterCallback, folderId = null) => {
      if (activeConversation?.id && activeConversation?.uuid && !activeConversation?.isPlayback) {
        stopListenCanvasEditorsChangeEvent();
        stopListenCanvasContentChangeEvent();
        emitLeaveRoom({
          conversation_id: activeConversation.id,
          conversation_uuid: activeConversation.uuid,
          project_id: projectId,
        });
      }
      const selectionCountAtStart = selectionCountRef?.current;
      const pendingConversation = {
        ...newConversation,
        isNamingPending: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setActiveConversation(prev => ({
        ...pendingConversation,
        ...(prev?.attachment_participant_id && {
          attachment_participant_id: prev.attachment_participant_id,
        }),
      }));
      if (folderId && setFolders) {
        updateFolderConversations(folderId, prev =>
          sortConversations([pendingConversation, ...prev.filter(c => !c.isNew)]),
        );
      } else {
        setConversations(prev => [pendingConversation, ...prev.filter(c => !c.isNew)]);
      }

      const result = await createConversation({
        is_private: newConversation.is_private,
        name: newConversation.name,
        participants: [],
        projectId,
        meta: newConversation.meta || {},
      });
      if (result.data) {
        trackEvent(GA_EVENT_NAMES.CONVERSATION_CREATED, {
          [GA_EVENT_PARAMS.HAS_ATTACHMENTS]: `${Boolean(newConversation.hasAttachments)}`,
          [GA_EVENT_PARAMS.TIMESTAMP]: new Date().toISOString().split('T')[0],
          [GA_EVENT_PARAMS.CONVERSATION_NAME]: newConversation.name || 'unknown',
          [GA_EVENT_PARAMS.CONVERSATION_ID]: result.data.id || 'unknown',
        });

        if (!shouldSetActiveAfterCallback) {
          if (
            !emitEnterRoom({
              conversation_id: result.data.id,
              conversation_uuid: result.data.uuid,
              project_id: projectId,
            })
          ) {
            setPendingEnterRoomEvent({
              conversation_id: result.data.id,
              conversation_uuid: result.data.uuid,
              project_id: projectId,
            });
          } else {
            listenCanvasEditorsChangeEvent();
            listenCanvasContentChangeEvent();
          }

          changeUrlByConversation(result.data.id, result.data.name);
          setActiveConversation(prev => ({
            ...result.data,
            participants: result.data.participants?.length
              ? result.data.participants
              : prev.participants || [],
            // Only keep isNamingPending if server returned the default name (meaning it's still generating a real name)
            isNamingPending: result.data.name === DefaultConversationName,
            ...(folderId && { folder_id: folderId }),
            ...(prev?.attachment_participant_id && {
              attachment_participant_id: prev.attachment_participant_id,
            }),
          }));

          const conversationWithTimestamp = {
            ...result.data,
            updated_at: result.data.updated_at || new Date().toISOString(),
            // Only keep isNamingPending if server returned the default name (meaning it's still generating a real name)
            isNamingPending: result.data.name === DefaultConversationName,
          };

          await fileCreatedConversation(
            folderId,
            conversationWithTimestamp,
            c => c.isNew || c.id === result.data.id,
          );

          onCreatedCallback && onCreatedCallback(result.data);
          selectConversation({ projectId, conversationId: result.data.id }).then(({ error }) => {
            if (!error)
              dispatch(
                chatActions.setLastSelectedConversationId({ projectId, conversationId: result.data.id }),
              );
          });
        } else {
          const isOnScreen = () =>
            selectionCountRef?.current === selectionCountAtStart &&
            isConversationOnScreen(newConversation.id, result.data.id);
          onCreatedCallback &&
            onCreatedCallback(
              result.data,
              async participants => {
                const conversationWithParticipants = {
                  ...result.data,
                  participants: [...participants],
                  isNamingPending: result.data.name === DefaultConversationName,
                  updated_at: result.data.updated_at || new Date().toISOString(),
                  ...(folderId && { folder_id: folderId }),
                };
                if (!isOnScreen()) {
                  // List it, but don't open it: another + Chat draft may be on screen, so match by id
                  await fileCreatedConversation(
                    folderId,
                    conversationWithParticipants,
                    c => c.id === newConversation.id || c.id === result.data.id,
                  );
                  return;
                }
                if (
                  !emitEnterRoom({
                    conversation_id: result.data.id,
                    conversation_uuid: result.data.uuid,
                    project_id: projectId,
                  })
                ) {
                  setPendingEnterRoomEvent({
                    conversation_id: result.data.id,
                    conversation_uuid: result.data.uuid,
                    project_id: projectId,
                  });
                } else {
                  listenCanvasEditorsChangeEvent();
                  listenCanvasContentChangeEvent();
                }

                changeUrlByConversation(result.data.id, result.data.name);
                const updatedConversation = {
                  ...result.data,
                  participants: [...participants],
                  // Only keep isNamingPending if server returned the default name (meaning it's still generating a real name)
                  isNamingPending: result.data.name === DefaultConversationName,
                };
                setActiveConversation(prev => ({
                  ...updatedConversation,
                  ...(folderId && { folder_id: folderId }),
                  ...(prev?.attachment_participant_id && {
                    attachment_participant_id: prev.attachment_participant_id,
                  }),
                }));

                const conversationWithTimestamp = {
                  ...updatedConversation,
                  updated_at: result.data.updated_at || new Date().toISOString(),
                };

                await fileCreatedConversation(
                  folderId,
                  conversationWithTimestamp,
                  c => c.isNew || c.id === result.data.id,
                );
                selectConversation({ projectId, conversationId: result.data.id }).then(({ error }) => {
                  if (!error)
                    dispatch(
                      chatActions.setLastSelectedConversationId({
                        projectId,
                        conversationId: result.data.id,
                      }),
                    );
                });
              },
              isOnScreen,
            );
        }
      } else {
        setActiveConversation(dummyConversation);
        if (folderId && setFolders) {
          updateFolderConversations(folderId, prev => prev.filter(c => !c.isNew));
        } else {
          setConversations(prev => prev.filter(item => !item.isNew));
        }
        onCreatedCallback && onCreatedCallback();
      }
    },
    [
      activeConversation?.id,
      activeConversation?.isPlayback,
      activeConversation?.uuid,
      changeUrlByConversation,
      createConversation,
      emitEnterRoom,
      emitLeaveRoom,
      projectId,
      setActiveConversation,
      setConversations,
      setFolders,
      updateFolderConversations,
      fileCreatedConversation,
      dispatch,
      selectConversation,
      isConversationOnScreen,
      selectionCountRef,
      listenCanvasEditorsChangeEvent,
      stopListenCanvasEditorsChangeEvent,
      listenCanvasContentChangeEvent,
      stopListenCanvasContentChangeEvent,
      trackEvent,
    ],
  );

  const onCancelCreateConversation = useCallback(() => {
    setActiveConversation(dummyConversation);
    setConversations(prev => prev.filter(item => !item.isNew));
    if (setFolders) {
      setFolders(prev =>
        prev.map(folder => ({
          ...folder,
          conversations: (folder.conversations || []).filter(c => !c.isNew),
        })),
      );
    }
    setActiveParticipant();
    resetCreateFlag();
  }, [resetCreateFlag, setActiveConversation, setActiveParticipant, setConversations, setFolders]);

  useEffect(() => {
    if (isCreateError) {
      toastError(buildErrorMessage(createError));
    }
  }, [createError, isCreateError, toastError]);

  useEffect(() => {
    if (pendingEnterRoomEvent && emitEnterRoom(pendingEnterRoomEvent)) {
      setPendingEnterRoomEvent();
      listenCanvasEditorsChangeEvent();
      listenCanvasContentChangeEvent();
    }
  }, [emitEnterRoom, listenCanvasContentChangeEvent, listenCanvasEditorsChangeEvent, pendingEnterRoomEvent]);

  useEffect(() => {
    if (isSelectConversationError) {
      toastError(buildErrorMessage(selectConversationError));
    }
  }, [toastError, isSelectConversationError, selectConversationError]);

  return {
    onCreateConversation,
    onCancelCreateConversation,
  };
}
