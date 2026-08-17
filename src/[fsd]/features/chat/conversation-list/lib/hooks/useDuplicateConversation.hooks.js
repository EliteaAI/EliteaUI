import { useCallback, useState } from 'react';

import {
  generateDuplicateName,
  sortConversations,
} from '@/[fsd]/features/chat/conversation-list/lib/helpers';
import { useConversationNavigation } from '@/[fsd]/features/chat/lib/hooks';
import {
  useAddParticipantIntoConversationMutation,
  useConversationCreateMutation,
  useLazyConversationDetailsQuery,
  useSelectConversationMutation,
} from '@/api';
import { ChatParticipantType } from '@/common/constants';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

export const useDuplicateConversation = props => {
  const {
    conversations,
    setActiveConversation,
    setConversations,
    emitEnterRoom,
    emitLeaveRoom,
    activeConversation,
    listenCanvasEditorsChangeEvent,
    stopListenCanvasEditorsChangeEvent,
    listenCanvasContentChangeEvent,
    stopListenCanvasContentChangeEvent,
  } = props;
  const projectId = useSelectedProjectId();
  const { toastError, toastInfo, toastSuccess } = useToast();
  const { changeUrlByConversation } = useConversationNavigation();

  const [createConversation] = useConversationCreateMutation();
  const [selectConversation] = useSelectConversationMutation();
  const [addParticipant] = useAddParticipantIntoConversationMutation();
  const [getConversationDetail] = useLazyConversationDetailsQuery();
  const [duplicatingConversationId, setDuplicatingConversationId] = useState(null);

  const onDuplicateConversation = useCallback(
    async conversation => {
      setDuplicatingConversationId(conversation.id);

      try {
        const newName = generateDuplicateName(conversation.name);
        let hasParticipantIssues = false;

        if (activeConversation?.id && activeConversation?.uuid && !activeConversation?.isPlayback) {
          stopListenCanvasEditorsChangeEvent();
          stopListenCanvasContentChangeEvent();
          emitLeaveRoom({
            conversation_id: activeConversation.id,
            conversation_uuid: activeConversation.uuid,
            project_id: projectId,
          });
        }

        const detailResult = await getConversationDetail({
          projectId,
          id: conversation.id,
        });

        if (detailResult.error) {
          toastError('Failed to duplicate conversation');
          return;
        }

        const sourceConversation = detailResult.data;

        const createResult = await createConversation({
          is_private: sourceConversation.is_private,
          name: newName,
          participants: [],
          projectId,
          meta: sourceConversation.meta || {},
        });

        if (!createResult.data) {
          toastError('Failed to duplicate conversation');
          return;
        }

        const newConversation = createResult.data;

        const existingParticipantIds = new Set((newConversation.participants || []).map(p => p.id));

        const participantsToAdd = (sourceConversation.participants || [])
          .filter(
            p =>
              p.entity_name !== ChatParticipantType.Dummy &&
              !p.meta?.added_from_agent &&
              !existingParticipantIds.has(p.id),
          )
          .map(p => ({
            entity_name: p.entity_name,
            entity_meta: p.entity_meta,
            entity_settings: p.entity_settings || {},
            meta: p.meta || {},
          }));

        if (participantsToAdd.length) {
          const addResult = await addParticipant({
            projectId,
            id: newConversation.id,
            participants: participantsToAdd,
          });

          if (addResult.error) hasParticipantIssues = true;
        }

        const finalDetailResult = await getConversationDetail({
          projectId,
          id: newConversation.id,
        });

        const finalConversation = finalDetailResult.data || newConversation;

        emitEnterRoom({
          conversation_id: finalConversation.id,
          conversation_uuid: finalConversation.uuid,
          project_id: projectId,
        });
        listenCanvasEditorsChangeEvent();
        listenCanvasContentChangeEvent();

        changeUrlByConversation(finalConversation.id, finalConversation.name);
        setActiveConversation(finalConversation);

        const conversationWithTimestamp = {
          ...finalConversation,
          updated_at: finalConversation.updated_at || new Date().toISOString(),
        };

        const sortedData = sortConversations([...conversations, conversationWithTimestamp]);
        setConversations(sortedData);

        selectConversation({
          projectId,
          conversationId: finalConversation.id,
        });

        if (hasParticipantIssues)
          toastInfo('Conversation duplicated, but some participants could not be added');
        else toastSuccess('Conversation duplicated successfully');
      } finally {
        setDuplicatingConversationId(null);
      }
    },
    [
      activeConversation,
      addParticipant,
      changeUrlByConversation,
      conversations,
      createConversation,
      emitEnterRoom,
      emitLeaveRoom,
      getConversationDetail,
      listenCanvasContentChangeEvent,
      listenCanvasEditorsChangeEvent,
      projectId,
      selectConversation,
      setActiveConversation,
      setConversations,
      stopListenCanvasContentChangeEvent,
      stopListenCanvasEditorsChangeEvent,
      toastError,
      toastInfo,
      toastSuccess,
    ],
  );

  return { onDuplicateConversation, duplicatingConversationId };
};
