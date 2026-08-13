import { useCallback, useEffect, useState } from 'react';

import { useTrackEvent } from '@/GA';
import { sortConversations } from '@/[fsd]/features/chat/conversation-list/lib/helpers';
import { useConversationNavigation } from '@/[fsd]/features/chat/lib/hooks';
import { GA_EVENT_NAMES, GA_EVENT_PARAMS } from '@/[fsd]/shared/lib/constants/analytic.constants';
import {
  useConversationCreateMutation,
  useConversationEditMutation,
  useSelectConversationMutation,
} from '@/api';
import { DefaultConversationName, dummyConversation } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import useResetCreateFlag from './useResetCreateFlag';

export default function useCreateConversation({
  activeConversation,
  conversations,
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
        setFolders(prev =>
          prev.map(folder =>
            folder.id === folderId
              ? {
                  ...folder,
                  conversations: sortConversations([
                    pendingConversation,
                    ...(folder.conversations || []).filter(c => !c.isNew),
                  ]),
                }
              : folder,
          ),
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

          if (folderId && setFolders) {
            await editConversation({ projectId, id: result.data.id, folder_id: folderId });
            setFolders(prev =>
              prev.map(folder =>
                folder.id === folderId
                  ? {
                      ...folder,
                      conversations: sortConversations([
                        { ...conversationWithTimestamp, folder_id: folderId },
                        ...(folder.conversations || []).filter(c => !c.isNew),
                      ]),
                    }
                  : folder,
              ),
            );
          } else {
            const sortedData = sortConversations([
              ...conversations.filter(item => !item.isNew),
              conversationWithTimestamp,
            ]);
            setConversations(sortedData);
          }

          onCreatedCallback && onCreatedCallback(result.data);
          selectConversation({
            projectId,
            conversationId: result.data.id,
          });
        } else {
          onCreatedCallback &&
            onCreatedCallback(result.data, async participants => {
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

              if (folderId && setFolders) {
                await editConversation({ projectId, id: result.data.id, folder_id: folderId });
                setFolders(prev =>
                  prev.map(folder =>
                    folder.id === folderId
                      ? {
                          ...folder,
                          conversations: sortConversations([
                            { ...conversationWithTimestamp, folder_id: folderId },
                            ...(folder.conversations || []).filter(c => !c.isNew),
                          ]),
                        }
                      : folder,
                  ),
                );
              } else {
                const sortedData = sortConversations([
                  ...conversations.filter(item => !item.isNew),
                  conversationWithTimestamp,
                ]);
                setConversations(sortedData);
              }
              selectConversation({
                projectId,
                conversationId: result.data.id,
              });
            });
        }
      } else {
        setActiveConversation(dummyConversation);
        if (folderId && setFolders) {
          setFolders(prev =>
            prev.map(folder =>
              folder.id === folderId
                ? { ...folder, conversations: (folder.conversations || []).filter(c => !c.isNew) }
                : folder,
            ),
          );
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
      conversations,
      createConversation,
      editConversation,
      emitEnterRoom,
      emitLeaveRoom,
      projectId,
      setActiveConversation,
      setConversations,
      setFolders,
      selectConversation,
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
