import { useCallback, useEffect, useMemo } from 'react';

import {
  DEFAULT_MAX_TOKENS,
  DEFAULT_REASONING_EFFORT,
  DEFAULT_TEMPERATURE,
} from '@/[fsd]/shared/lib/constants/llmSettings.constants';
import { useListModelsQuery, useUpdateApplicationVersionMutation } from '@/api';
import { useAddParticipantIntoConversationMutation, useLazyConversationDetailsQuery } from '@/api/chat';
import { ChatParticipantType } from '@/common/constants';
import { buildErrorMessage, getChatParticipantUniqueId } from '@/common/utils';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

export const isParticipantOKForChat = participant => {
  return (
    participant.entity_name === ChatParticipantType.Users ||
    // participant.entity_name === ChatParticipantType.Models ||
    participant.entity_name === ChatParticipantType.Toolkits ||
    (participant.entity_name === ChatParticipantType.Datasources &&
      participant.entity_settings.datasource_settings?.chat) ||
    participant.entity_name === ChatParticipantType.Applications ||
    participant.entity_name === ChatParticipantType.Pipelines
  );
};

export const canParticipantBeActiveInChat = participant => {
  return (
    participant.entity_name === ChatParticipantType.Users ||
    participant.entity_name === ChatParticipantType.Applications ||
    participant.entity_name === ChatParticipantType.Pipelines
  );
};

export const transformParticipant = (participantType, participant, variables) =>
  participantType !== ChatParticipantType.Models
    ? {
        entity_name:
          participant.agent_type === 'pipeline' ? ChatParticipantType.Applications : participantType,
        entity_meta: {
          id: participant.id,
          name: participant.name,
          project_id: participant.project_id || undefined,
        },
        entity_settings: {
          variables:
            variables ||
            participant.entity_settings?.variables ||
            (participantType === ChatParticipantType.Applications
              ? participant.version_details?.variables
              : undefined) ||
            [],
          icon_meta:
            participantType !== ChatParticipantType.Toolkits
              ? {
                  ...(participant.entity_settings?.icon_meta ||
                    participant.meta?.icon_meta ||
                    participant.icon_meta ||
                    {}),
                }
              : {},
          toolkit_type: participant.type,
          agent_type: participant.agent_type,
          // Preserve version_id if it exists
          ...(participant.entity_settings?.version_id && {
            version_id: participant.entity_settings.version_id,
          }),
          mcp_server_url:
            participant.settings?.url || participant.entity_settings?.mcp_server_url || undefined,
          // For newly created agents, preserve version_id from version_details if entity_settings doesn't have it
          ...(participantType === ChatParticipantType.Applications &&
            participant.version_details?.id &&
            !participant.entity_settings?.version_id && { version_id: participant.version_details.id }),
        },
        meta: {
          mcp: participant.meta?.mcp || undefined,
        },
      }
    : {
        entity_name: ChatParticipantType.Models,
        entity_meta: {
          integration_uid: participant.integration_uid,
          model_name: participant.model_name,
        },
        entity_settings: {
          max_tokens: participant.max_tokens || DEFAULT_MAX_TOKENS,
          temperature: participant.temperature || DEFAULT_TEMPERATURE,
          reasoning_effort: participant.reasoning_effort || DEFAULT_REASONING_EFFORT,
        },
      };

// Use unique participant IDs that include project_id to distinguish between public and custom entities
const isEqual = (a, b, type, idFieldName) => {
  // For models, we still use the old logic since they don't have project conflicts
  if (type === ChatParticipantType.Models) {
    return (
      a.entity_name === b.entity_name &&
      a.entity_meta[idFieldName] === b.entity_meta[idFieldName] &&
      a.entity_meta.integration_uid === b.entity_meta.integration_uid
    );
  }

  // For all other types, use unique IDs to distinguish between public and custom entities
  return getChatParticipantUniqueId(a) === getChatParticipantUniqueId(b);
};

const useAddNewParticipants = ({
  toastError,
  activeConversation,
  setActiveConversation,
  setConversations,
  newConversationViewRef,
}) => {
  const [addParticipant, { isError: isAddParticipantError, error: addParticipantError }] =
    useAddParticipantIntoConversationMutation();
  const [getConversationDetail] = useLazyConversationDetailsQuery();
  const projectId = useSelectedProjectId();
  const { data: modelsData = { items: [], total: 0 } } = useListModelsQuery(
    { projectId, include_shared: true },
    { skip: !projectId },
  );
  const [saveFn] = useUpdateApplicationVersionMutation();

  const defaultModel = useMemo(() => {
    return modelsData?.items.find(model => model.default) || modelsData?.items[0] || null;
  }, [modelsData?.items]);

  const handleNewParticipants = useCallback(
    async (transformedParticipants, newConversation, onAddedCallback, originalParticipants) => {
      const participantsToAdd = transformedParticipants.filter(participant => {
        const { entity_name: type } = participant;
        const idFieldName = type === ChatParticipantType.Models ? 'model_name' : 'id';
        return !(newConversation || activeConversation)?.participants.find(item =>
          isEqual(item, participant, type, idFieldName),
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

        for (let index = 0; index < agentOrPipelineWithoutLLM.length; index++) {
          const element = agentOrPipelineWithoutLLM[index];
          // Save the version details
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
          });
        }
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
        newConversationViewRef.current?.onSelectParticipant?.(participants[0]);
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

export default useAddNewParticipants;
