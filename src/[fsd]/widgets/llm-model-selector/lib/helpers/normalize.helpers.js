import { LLMSettingsConstants } from '@/[fsd]/shared/lib/constants';
import { defaultReasoningEffortFor } from '@/[fsd]/shared/lib/utils/llmSettings.utils';
import { isNullOrUndefined } from '@/common/utils';

const { DEFAULT_MAX_TOKENS, DEFAULT_STEPS_LIMIT, DEFAULT_TEMPERATURE } = LLMSettingsConstants;

export const normalizeLlmSettings = (settings = {}, model, { showStepsLimit = false } = {}) => {
  const isReasoning = model?.supports_reasoning;

  return {
    ...settings,
    max_tokens: isNullOrUndefined(settings.max_tokens) ? DEFAULT_MAX_TOKENS : settings.max_tokens,
    ...(isReasoning && {
      reasoning_effort: isNullOrUndefined(settings.reasoning_effort)
        ? defaultReasoningEffortFor(model)
        : settings.reasoning_effort,
    }),
    ...(!isReasoning && {
      temperature: isNullOrUndefined(settings.temperature) ? DEFAULT_TEMPERATURE : settings.temperature,
    }),
    ...(showStepsLimit && {
      steps_limit: isNullOrUndefined(settings.steps_limit) ? DEFAULT_STEPS_LIMIT : settings.steps_limit,
    }),
  };
};
