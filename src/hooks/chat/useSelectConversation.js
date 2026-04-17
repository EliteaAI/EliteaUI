import { useCallback, useEffect, useRef, useState } from 'react';

import { useDispatch } from 'react-redux';

import { useConversationNavigation } from '@/[fsd]/features/chat/lib/hooks';
import { useLazyConversationDetailsQuery, useSelectConversationMutation } from '@/api/chat';
import { convertConversationToChatHistory } from '@/common/convertChatConversationMessages';
import { areTheSameConversations, buildErrorMessage, getChatParticipantUniqueId } from '@/common/utils';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import { actions as chatActions } from '@/slices/chat';

import useLocalActiveParticipant from './useLocalActiveParticipant';

export default function useSelectConversation({
  activeConversation,
  emitEnterRoom,
  emitLeaveRoom,
  getLocalActiveParticipant,
  setActiveParticipant,
  setConversations,
  playbackChatBoxRef,
  setActiveConversation,
  toastError,
  listenCanvasEditorsChangeEvent,
  stopListenCanvasEditorsChangeEvent,
  listenCanvasContentChangeEvent,
  stopListenCanvasContentChangeEvent,
}) {
  const dispatch = useDispatch();
  const { clearUrlConversation, changeUrlByConversation } = useConversationNavigation();
  const projectId = useSelectedProjectId();
  const [pendingEnterRoomEvent, setPendingEnterRoomEvent] = useState();
  const [isSelectingConversation, setIsSelectingConversation] = useState(false);
  const prevSelectedConversationIdRef = useRef({ id: undefined, isPlayback: false });
  const inFlightConversationIdRef = useRef(null);
  const { clearLocalActiveParticipant } = useLocalActiveParticipant();
  const [
    getConversationDetail,
    { isError: isQueryDetailError, error: queryDetailError, isFetching: isLoadingConversation },
  ] = useLazyConversationDetailsQuery();
  const [selectConversation, { isError: isSelectConversationError, error: selectConversationError }] =
    useSelectConversationMutation();

  const onSelectConversation = useCallback(
    async conversation => {
      // Guard: Skip fetching details for dummy/invalid conversations (e.g., after deleting the last conversation)
      if (!conversation?.id || typeof conversation.id !== 'number') return;

      // Guard: skip if this exact conversation is already being fetched
      const conversationKey = `${conversation.id}:${!!conversation.isPlayback}`;
      if (inFlightConversationIdRef.current === conversationKey) return;

      if (
        !areTheSameConversations(activeConversation, conversation) &&
        !areTheSameConversations(prevSelectedConversationIdRef.current, conversation)
      ) {
        inFlightConversationIdRef.current = conversationKey;
        prevSelectedConversationIdRef.current.id = conversation.id;
        prevSelectedConversationIdRef.current.isPlayback = !!conversation.isPlayback;
        if (activeConversation?.id && !activeConversation?.isPlayback) {
          stopListenCanvasEditorsChangeEvent();
          stopListenCanvasContentChangeEvent();
          emitLeaveRoom({
            conversation_id: activeConversation.id,
            conversation_uuid: activeConversation.uuid,
            project_id: projectId,
          });
        }
        if (!conversation.isPlayback) {
          setIsSelectingConversation(true);
          const result = await getConversationDetail({
            projectId,
            id: conversation.id,
          });
          changeUrlByConversation(conversation.id, result.data?.name || conversation.name);
          if (result.data) {
            selectConversation({
              projectId,
              conversationId: conversation.id,
            });
            setActiveConversation({
              ...conversation,
              ...result.data,
              chat_history: convertConversationToChatHistory(result.data),
            });
            const localActiveParticipant = getLocalActiveParticipant(result.data.id);
            if (localActiveParticipant.conversationId == result.data.id) {
              const foundParticipant = result.data.participants.find(
                item => getChatParticipantUniqueId(item) == localActiveParticipant.participantId,
              );
              if (foundParticipant) {
                setActiveParticipant(foundParticipant);
              } else {
                setActiveParticipant();
                clearLocalActiveParticipant(result.data.id);
              }
            } else {
              setActiveParticipant();
            }
            setConversations(prev => prev.filter(item => !item.isNew));
            if (
              !emitEnterRoom({
                conversation_id: conversation.id,
                conversation_uuid: result.data.uuid,
                project_id: projectId,
              })
            ) {
              setPendingEnterRoomEvent({
                conversation_id: conversation.id,
                conversation_uuid: result.data.uuid,
                project_id: projectId,
              });
            } else {
              listenCanvasEditorsChangeEvent();
              listenCanvasContentChangeEvent();
            }
          }

          setIsSelectingConversation(false);
          inFlightConversationIdRef.current = null;
        } else {
          clearUrlConversation();
          playbackChatBoxRef.current?.reset();
          setActiveConversation(conversation);
          setActiveParticipant(null);
          setConversations(prev => prev.filter(item => !item.isNew));
          inFlightConversationIdRef.current = null;
        }
        dispatch(chatActions.setIsCreatingNewConversation(false));
      }
    },
    [
      activeConversation,
      emitLeaveRoom,
      projectId,
      changeUrlByConversation,
      getConversationDetail,
      setActiveConversation,
      getLocalActiveParticipant,
      setConversations,
      emitEnterRoom,
      setActiveParticipant,
      clearLocalActiveParticipant,
      clearUrlConversation,
      playbackChatBoxRef,
      selectConversation,
      listenCanvasEditorsChangeEvent,
      stopListenCanvasEditorsChangeEvent,
      listenCanvasContentChangeEvent,
      stopListenCanvasContentChangeEvent,
      dispatch,
    ],
  );

  useEffect(() => {
    if (pendingEnterRoomEvent && emitEnterRoom(pendingEnterRoomEvent)) {
      setPendingEnterRoomEvent();
      listenCanvasEditorsChangeEvent();
      listenCanvasContentChangeEvent();
    }
  }, [emitEnterRoom, listenCanvasContentChangeEvent, listenCanvasEditorsChangeEvent, pendingEnterRoomEvent]);

  useEffect(() => {
    if (isQueryDetailError) {
      // Suppress "No such conversation" errors (400 status) - these are expected after deleting the last conversation
      // Check both status code and error message for more precise suppression
      const isExpectedDeleteError =
        queryDetailError?.status === 400 &&
        queryDetailError?.data?.error?.toLowerCase?.()?.includes('no such conversation');
      if (!isExpectedDeleteError) {
        toastError(buildErrorMessage(queryDetailError));
      }
    }
  }, [queryDetailError, isQueryDetailError, toastError]);

  useEffect(() => {
    if (isSelectConversationError) {
      // Suppress "No such conversation" errors (400 status) - these are expected after deleting the last conversation
      // Check both status code and error message for more precise suppression
      const isExpectedDeleteError =
        selectConversationError?.status === 400 &&
        selectConversationError?.data?.error?.toLowerCase?.()?.includes('no such conversation');
      if (!isExpectedDeleteError) {
        toastError(buildErrorMessage(selectConversationError));
      }
    }
  }, [toastError, isSelectConversationError, selectConversationError]);

  useEffect(() => {
    if (
      activeConversation?.isPlayback !== prevSelectedConversationIdRef.current.isPlayback ||
      activeConversation?.id !== prevSelectedConversationIdRef.current.id
    ) {
      prevSelectedConversationIdRef.current.id = activeConversation.id;
      prevSelectedConversationIdRef.current.isPlayback = activeConversation?.isPlayback;
    }
  }, [activeConversation?.id, activeConversation?.isPlayback]);

  return {
    onSelectConversation,
    isLoadingConversation,
    isSelectingConversation,
  };
}
