import { ParticipantEntityTypes } from '@/[fsd]/features/chat/lib/constants/participant.constants';
import { DEFAULT_MAX_TOKENS, DEFAULT_TEMPERATURE } from '@/[fsd]/shared/lib/constants/llmSettings.constants';
import { ChatParticipantType } from '@/common/constants';

export const DEFAULT_LLM_SETTINGS = {
  temperature: DEFAULT_TEMPERATURE,
  max_tokens: DEFAULT_MAX_TOKENS,
  top_k: 40,
};

export const createToolkitConversationWithParticipant = async options => {
  const {
    createConversation,
    addParticipant,
    toolkitId,
    projectId,
    values,
    llmSettings = DEFAULT_LLM_SETTINGS,
    selectedModel = null,
    meta = {},
  } = options;

  if (!toolkitId) {
    throw new Error('toolkitId is required to create a toolkit conversation');
  }

  const toolkitSingleParticipant = {
    entity_name: ParticipantEntityTypes.Toolkit,
    entity_meta: {
      id: toolkitId,
      project_id: projectId,
    },
  };

  const conversationResult = await createConversation({
    is_private: true,
    name: meta.name || `Toolkit conversation: ${toolkitId}`,
    source: ChatParticipantType.Toolkits,
    meta: {
      toolkit_id: toolkitId,
      single_participant: toolkitSingleParticipant,
      ...meta,
    },
    participants: [],
    projectId,
  });

  if (!conversationResult.data) {
    return null;
  }

  const toolkitParticipant = {
    projectId,
    id: conversationResult.data.id,
    participants: [
      {
        entity_name: ChatParticipantType.Toolkits,
        entity_meta: {
          id: toolkitId,
          project_id: projectId,
        },
        entity_settings: {
          ...values.settings,
          toolkit_type: values.type,
          llm_settings: {
            model_name: selectedModel?.name,
            model_project_id: selectedModel?.project_id,
            ...llmSettings,
          },
        },
      },
    ],
  };

  const participantResult = await addParticipant(toolkitParticipant);

  return {
    ...conversationResult.data,
    participants: [...(conversationResult.data?.participants || []), ...(participantResult.data || [])],
  };
};

export const findToolkitParticipant = conversation => {
  return conversation?.participants?.find(p => p.entity_name === ChatParticipantType.Toolkits);
};
