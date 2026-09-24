import { useCallback, useEffect, useRef, useState } from 'react';

import { autoModel, isAutoSelection } from '@/[fsd]/shared/lib/utils';
import { ChatParticipantType } from '@/common/constants';

import * as NewConversationHelpers from '../helpers/newConversation.helpers';

// Hydrate a saved conversation once; catalog refreshes must not overwrite a
// choice made in its composer. Agent editor props remain reactive.
export const useSelectedChatModel = ({
  projectId,
  userId,
  activeConversation,
  modelsData,
  defaultModel,
  isAgentsPage = false,
  llmSettings,
  isLoadingConversation = false,
  activeParticipant,
  onClearActiveParticipant,
  onChangeParticipantSettings,
}) => {
  const [selectedModel, setSelectedModel] = useState(null);
  const initializedConversationModelRef = useRef(null);
  const selectSavedOrDefaultModel = useCallback(
    (forceSelect = true) => {
      if (forceSelect) {
        onClearActiveParticipant(false);
      }

      let settingsToUse = null;

      if (isAgentsPage && llmSettings) {
        // On agents page, use the llmSettings prop directly
        settingsToUse = {
          selection: llmSettings.selection,
          model_name: llmSettings.model_name,
          model_project_id: llmSettings.model_project_id,
        };
      } else {
        // Fallback to user settings (original behavior for conversations)
        const userSettings = NewConversationHelpers.getChatUserSettings(activeConversation, userId);
        if (userSettings) {
          settingsToUse = {
            selection: userSettings.selection,
            model_name: userSettings.model_name,
            model_project_id: userSettings.model_project_id,
          };
        }
      }

      if (isAutoSelection(settingsToUse)) {
        setSelectedModel(autoModel(settingsToUse.selection.profile_ref));
        return;
      }
      if (settingsToUse) {
        if (settingsToUse.model_name) {
          // First try to find the model with the exact project_id
          let model = modelsData.items.find(
            p => p.name === settingsToUse.model_name && p.project_id === settingsToUse.model_project_id,
          );

          // If not found, try to find it as a shared model (project_id might be different)
          if (!model) {
            model = modelsData.items.find(p => p.name === settingsToUse.model_name);
          }

          if (model) {
            setSelectedModel(model);
          } else {
            setSelectedModel(defaultModel);
          }
        } else {
          if (isAgentsPage && onChangeParticipantSettings) {
            // If no model is set in llm settings of agents,
            // update the participant to use default model
            const updatedSettings = {
              ...activeParticipant?.entity_settings,
              llm_settings: {
                ...activeParticipant?.entity_settings.llm_settings,
                model_name: defaultModel?.name,
                model_project_id: defaultModel?.project_id,
              },
            };
            onChangeParticipantSettings(activeParticipant?.id, { entity_settings: updatedSettings });
          }
          setSelectedModel(defaultModel);
        }
      } else {
        setSelectedModel(defaultModel);
      }
    },
    [
      isAgentsPage,
      llmSettings,
      onClearActiveParticipant,
      activeConversation,
      userId,
      modelsData.items,
      defaultModel,
      onChangeParticipantSettings,
      activeParticipant?.entity_settings,
      activeParticipant?.id,
    ],
  );

  useEffect(() => {
    if (!isAgentsPage) {
      // A saved chat owns its selection. Later catalog/default refreshes must
      // not replace an explicit composer choice in that same conversation.
      const identity = activeConversation?.uuid && `${projectId}:${activeConversation.uuid}`;
      const caller =
        userId &&
        activeConversation?.participants?.find(
          participant =>
            participant.entity_name === ChatParticipantType.Users && participant.entity_meta?.id === userId,
        );
      // Core detail responses include message_groups; sidebar metadata does not.
      // A loaded shared chat may have no caller participant until they join.
      const hasDetails =
        Array.isArray(activeConversation?.participants) && Array.isArray(activeConversation?.message_groups);
      if (
        !identity ||
        !userId ||
        isLoadingConversation ||
        (!caller && !hasDetails) ||
        !modelsData.items.length
      ) {
        if (initializedConversationModelRef.current !== identity) setSelectedModel(null);
        return;
      }
      if (initializedConversationModelRef.current === identity) return;
      initializedConversationModelRef.current = identity;
    }
    selectSavedOrDefaultModel(false);
    // Preserve hydration triggers: changing a participant callback must not
    // reset an Agent composer's unsaved selection. Saved settings still react.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isAgentsPage,
    projectId,
    activeConversation?.uuid,
    activeConversation?.participants,
    activeConversation?.message_groups,
    isLoadingConversation,
    userId,
    llmSettings,
    defaultModel,
    modelsData.items.length,
  ]);

  return { selectedModel, setSelectedModel, selectSavedOrDefaultModel };
};
