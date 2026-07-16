import { ParticipantEntityTypes } from '@/[fsd]/features/chat/participants/lib/constants/participant.constants';
import { DEFAULT_MAX_TOKENS, DEFAULT_TEMPERATURE } from '@/[fsd]/shared/lib/constants/llmSettings.constants';
import { generateLLMSettings } from '@/[fsd]/shared/lib/utils/llmSettings.utils';
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

  // Align the family pair to the model so a reasoning model never carries a stale temperature
  // (issue #5859). Persist-time uses generateLLMSettings (not resetLLMSettingsForModel) so a
  // user-tuned reasoning_effort/temperature within the family is preserved, not hard-reset.
  // Strip both from the base first — generateLLMSettings emits only the correct one.
  // eslint-disable-next-line no-unused-vars
  const { temperature: _t, reasoning_effort: _re, ...baseLlmSettings } = llmSettings || {};
  const alignedLlmSettings = {
    ...baseLlmSettings,
    model_name: selectedModel?.name,
    model_project_id: selectedModel?.project_id,
    ...generateLLMSettings(selectedModel, llmSettings, { includeModelInfo: true }),
  };

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
          llm_settings: alignedLlmSettings,
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
