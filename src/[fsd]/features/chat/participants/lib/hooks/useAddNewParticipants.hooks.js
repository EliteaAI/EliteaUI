import { useCallback, useEffect, useMemo } from 'react';

import {
  useAddParticipantIntoConversationMutation,
  useLazyConversationDetailsQuery,
  useListModelsQuery,
  useUpdateApplicationVersionMutation,
} from '@/api';
import { ChatParticipantType } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import { isParticipantsEqual, transformParticipant } from '../helpers/addParticipants.helpers';
import { getChatParticipantUniqueId } from '../helpers/participants.helpers';

export const useAddNewParticipants = props => {
  const { toastError, activeConversation, setActiveConversation, setConversations, newConversationViewRef } =
    props;

  const projectId = useSelectedProjectId();

  const [addParticipant, { isError: isAddParticipantError, error: addParticipantError }] =
    useAddParticipantIntoConversationMutation();
  const [saveFn] = useUpdateApplicationVersionMutation();

  const [getConversationDetail] = useLazyConversationDetailsQuery();

  const { data: modelsData = { items: [], total: 0 } } = useListModelsQuery(
    { projectId, include_shared: true },
    { skip: !projectId },
  );

  const defaultModel = useMemo(() => {
    return modelsData?.items.find(model => model.default) || modelsData?.items[0] || null;
  }, [modelsData?.items]);

  const handleNewParticipants = useCallback(
    async (transformedParticipants, newConversation, onAddedCallback, originalParticipants) => {
      const participantsToAdd = transformedParticipants.filter(participant => {
        const { entity_name: type } = participant;
        const idFieldName = type === ChatParticipantType.Models ? 'model_name' : 'id';
        return !(newConversation || activeConversation)?.participants.find(item =>
          isParticipantsEqual(item, participant, type, idFieldName),
        );
      });
      if (participantsToAdd.length) {
        // Check if the original participants contain any agent/pipeline and the versionDetails has no llm model,
        // then set default LLM settings and save the version details before adding participants
        const agentOrPipelineWithoutLLM = originalParticipants.filter(participant => {
          const { entity_name: type } = participant;
          return (
            (type === ChatParticipantType.Applications || type === ChatParticipantType.Pipelines) &&
            !participant.version_details?.llm_settings?.model_name
          );
        });

        agentOrPipelineWithoutLLM.forEach(element =>
          saveFn({
            projectId,
            applicationId: element.id,
            versionId: element.version_details?.id,
            ...(element.version_details || {}),
            llm_settings: {
              ...(element.version_details?.llm_settings || {}),
              model_name: defaultModel?.name,
              model_project_id: defaultModel?.project_id,
            },
          }),
        );
        const result = await addParticipant({
          projectId,
          id: newConversation?.id || activeConversation.id,
          participants: participantsToAdd,
        });

        if (!result.error && result.data.length) {
          let updatedParticipants = result.data;
          let attachmentParticipantId = null;

          if (participantsToAdd.some(p => p.entity_name === ChatParticipantType.Applications)) {
            const conversationId = newConversation?.id || activeConversation.id;
            const updatedConversationResult = await getConversationDetail({
              projectId,
              id: conversationId,
            });

            if (updatedConversationResult.data && !updatedConversationResult.error) {
              const fullConversationParticipants = updatedConversationResult.data.participants || [];

              // Only include newly added participants (from result.data) plus any auto-created toolkit participants
              updatedParticipants = fullConversationParticipants.filter(participant => {
                // Include if it was in the original result.data (explicitly added)
                const wasExplicitlyAdded = result.data.some(
                  addedParticipant =>
                    getChatParticipantUniqueId(participant) === getChatParticipantUniqueId(addedParticipant),
                );

                // Include if it's a toolkit participant that wasn't in the original conversation (auto-created)
                const isAutoCreatedToolkit =
                  participant.entity_name === ChatParticipantType.Toolkits &&
                  !(newConversation || activeConversation)?.participants?.some(
                    existing =>
                      getChatParticipantUniqueId(existing) === getChatParticipantUniqueId(participant),
                  );

                return wasExplicitlyAdded || isAutoCreatedToolkit;
              });
            }

            attachmentParticipantId = updatedConversationResult.data.attachment_participant_id;
          }

          if (!newConversation) {
            setActiveConversation(prev => {
              if (prev.id) {
                const newParticipants = updatedParticipants.filter(
                  updatedParticipant =>
                    !prev.participants?.find(
                      participant =>
                        getChatParticipantUniqueId(participant) ===
                        getChatParticipantUniqueId(updatedParticipant),
                    ),
                );
                return {
                  ...prev,
                  participants: [...prev.participants, ...newParticipants],
                  ...(attachmentParticipantId && { attachment_participant_id: attachmentParticipantId }),
                };
              } else {
                return prev;
              }
            });
            setConversations(prev => {
              return prev.map(conversation => {
                if (conversation.id === activeConversation?.id && !conversation.isPlayback) {
                  const newParticipants = updatedParticipants.filter(
                    item =>
                      !conversation.participants?.find(
                        participant =>
                          getChatParticipantUniqueId(participant) === getChatParticipantUniqueId(item),
                      ),
                  );
                  return {
                    ...conversation,
                    participants: [...(conversation.participants || []), ...newParticipants],
                    ...(attachmentParticipantId && { attachment_participant_id: attachmentParticipantId }),
                  };
                } else {
                  return conversation;
                }
              });
            });
          } else {
            const newParticipants = updatedParticipants.filter(
              item =>
                !newConversation.participants.find(
                  participant => getChatParticipantUniqueId(participant) === getChatParticipantUniqueId(item),
                ),
            );
            const finalNewConversation = {
              ...newConversation,
              participants: [...newConversation.participants, ...newParticipants],
              ...(attachmentParticipantId && { attachment_participant_id: attachmentParticipantId }),
            };
            setActiveConversation(finalNewConversation);
            setConversations(prev => {
              let foundedConversation = false;
              const newConversationList = prev.map(conversation => {
                if (conversation.id === newConversation.id) {
                  foundedConversation = true;
                  return finalNewConversation;
                } else {
                  return conversation;
                }
              });

              if (foundedConversation) {
                return newConversationList;
              } else {
                return [finalNewConversation, ...newConversationList];
              }
            });
          }
          onAddedCallback?.(updatedParticipants);
        }
      }
    },
    [
      activeConversation,
      addParticipant,
      getConversationDetail,
      defaultModel?.name,
      defaultModel?.project_id,
      projectId,
      saveFn,
      setActiveConversation,
      setConversations,
    ],
  );

  const addNewParticipants = useCallback(
    async (participants, onAddedCallback) => {
      if (activeConversation?.isPlayback) return;

      if (!activeConversation?.id || activeConversation?.isNew) {
        participants.forEach(p => newConversationViewRef.current?.onSelectParticipant?.(p));
        return;
      }

      const transformedParticipants = participants.map(item => {
        const { participantType, ...participant } = item;
        return transformParticipant(participantType, participant);
      });

      handleNewParticipants(transformedParticipants, null, onAddedCallback, participants);
    },
    [
      activeConversation?.id,
      activeConversation?.isNew,
      activeConversation?.isPlayback,
      handleNewParticipants,
      newConversationViewRef,
    ],
  );

  const addParticipantsToNewConversation = useCallback(
    async (participants, newConversation, onAddedCallback) => {
      if ((!activeConversation?.id || activeConversation?.isPlayback) && !newConversation) {
        return;
      }
      const transformedParticipants = participants.map(item => {
        const { participantType, ...participant } = item;
        return transformParticipant(participantType, participant);
      });

      handleNewParticipants(transformedParticipants, newConversation, onAddedCallback, participants);
    },
    [activeConversation?.id, activeConversation?.isPlayback, handleNewParticipants],
  );

  useEffect(() => {
    if (isAddParticipantError) {
      toastError(buildErrorMessage(addParticipantError));
    }
  }, [addParticipantError, isAddParticipantError, toastError]);

  return {
    addNewParticipants,
    addParticipantsToNewConversation,
  };
};
