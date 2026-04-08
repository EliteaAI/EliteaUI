import {
  DEFAULT_MAX_TOKENS_CUSTOM,
  DEFAULT_REASONING_EFFORT,
  DEFAULT_TEMPERATURE,
} from '@/[fsd]/shared/lib/constants/llmSettings.constants';
import {
  CONTEXT_MESSAGES,
  DEFAULT_CONTEXT_STRATEGY,
  DEFAULT_PERSONA,
} from '@/[fsd]/widgets/ContextBudget/lib/constants';

/**
 * Serializes context strategy data into form data structure
 */
export const serializeFormData = (
  contextStrategy,
  selectedProjectId,
  defaultModel,
  conversationInstructions,
  persona,
) => ({
  persona: persona || DEFAULT_PERSONA,
  enabled: contextStrategy.enabled ?? DEFAULT_CONTEXT_STRATEGY.ENABLED,
  max_context_tokens: contextStrategy.max_context_tokens || DEFAULT_CONTEXT_STRATEGY.MAX_CONTEXT_TOKENS,
  preserve_recent_messages:
    contextStrategy.preserve_recent_messages || DEFAULT_CONTEXT_STRATEGY.PRESERVE_RECENT_MESSAGES,
  preserve_system_messages:
    contextStrategy.preserve_system_messages ?? DEFAULT_CONTEXT_STRATEGY.PRESERVE_SYSTEM_MESSAGES,
  system_messages: conversationInstructions || '',
  enable_summarization: contextStrategy.enable_summarization ?? DEFAULT_CONTEXT_STRATEGY.ENABLE_SUMMARIZATION,
  summary_llm_settings: {
    model_name: contextStrategy.summary_llm_settings?.model_name || defaultModel?.name || '',
    model_project_id:
      contextStrategy.summary_llm_settings?.model_project_id || defaultModel?.project_id || selectedProjectId,
    temperature: contextStrategy.summary_llm_settings?.temperature || DEFAULT_TEMPERATURE,
    max_tokens: contextStrategy.summary_llm_settings?.max_tokens || DEFAULT_MAX_TOKENS_CUSTOM,
    reasoning_effort: contextStrategy.reasoning_effort || DEFAULT_REASONING_EFFORT,
    instructions:
      contextStrategy.summary_llm_settings?.instructions ||
      contextStrategy.summary_instructions ||
      CONTEXT_MESSAGES.DEFAULT_SUMMARY_INSTRUCTION,
  },
});
