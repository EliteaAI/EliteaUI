import { useCallback, useEffect, useState } from 'react';

import { useTrackEvent } from '@/GA';
import { useConversationNavigation } from '@/[fsd]/features/chat/lib/hooks';
import { GA_EVENT_NAMES, GA_EVENT_PARAMS } from '@/[fsd]/shared/lib/constants/analytic.constants';
import { useConversationCreateMutation, useSelectConversationMutation } from '@/api/chat';
import { DefaultConversationName, dummyConversation } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import { sortConversations } from './usePinConversation';
import useResetCreateFlag from './useResetCreateFlag';

export default function useCreateConversation({
  activeConversation,
  conversations,
  setActiveConversation,
  setConversations,
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
  const [selectConversation, { isError: isSelectConversationError, error: selectConversationError }] =
    useSelectConversationMutation();

  const onCreateConversation = useCallback(
    async (newConversation, onCreatedCallback, shouldSetActiveAfterCallback) => {
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
      setConversations(prev => [pendingConversation, ...prev.filter(c => !c.isNew)]);

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
            // Only keep isNamingPending if server returned the default name (meaning it's still generating a real name)
            isNamingPending: result.data.name === DefaultConversationName,
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

          const sortedData = sortConversations([
            ...conversations.filter(item => !item.isNew),
            conversationWithTimestamp,
          ]);

          setConversations(sortedData);
          onCreatedCallback && onCreatedCallback(result.data);
          selectConversation({
            projectId,
            conversationId: result.data.id,
          });
        } else {
          onCreatedCallback &&
            onCreatedCallback(result.data, participants => {
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
                ...(prev?.attachment_participant_id && {
                  attachment_participant_id: prev.attachment_participant_id,
                }),
              }));

              const conversationWithTimestamp = {
                ...updatedConversation,
                updated_at: result.data.updated_at || new Date().toISOString(),
              };
              const sortedData = sortConversations([
                ...conversations.filter(item => !item.isNew),
                conversationWithTimestamp,
              ]);

              setConversations(sortedData);
              selectConversation({
                projectId,
                conversationId: result.data.id,
              });
            });
        }
      } else {
        setActiveConversation(dummyConversation);
        setConversations(prev => prev.filter(item => !item.isNew));
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
      emitEnterRoom,
      emitLeaveRoom,
      projectId,
      setActiveConversation,
      setConversations,
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
    setActiveParticipant();
    resetCreateFlag();
  }, [resetCreateFlag, setActiveConversation, setActiveParticipant, setConversations]);

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
