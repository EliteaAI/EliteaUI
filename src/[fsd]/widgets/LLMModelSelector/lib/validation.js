import { DEFAULT_MAX_TOKENS, REASONING_MIN_TOKENS } from '@/[fsd]/shared/lib/constants/llmSettings.constants';

export const VALIDATION_RULE = {
  EXCEEDS_MODEL_LIMIT: 'EXCEEDS_MODEL_LIMIT',
  REASONING_MIN_TOKENS: 'REASONING_MIN_TOKENS',
  VALID: 'VALID',
};

export const validateMaxTokens = (maxTokens, selectedModel) => {
  if (maxTokens === DEFAULT_MAX_TOKENS) return VALIDATION_RULE.VALID;
  if (selectedModel?.max_output_tokens < maxTokens) return VALIDATION_RULE.EXCEEDS_MODEL_LIMIT;
  if (selectedModel?.supports_reasoning && maxTokens < REASONING_MIN_TOKENS)
    return VALIDATION_RULE.REASONING_MIN_TOKENS;

  return VALIDATION_RULE.VALID;
};

export const getMaxTokensHelperText = (validationResult, selectedModel) => {
  switch (validationResult) {
    case VALIDATION_RULE.EXCEEDS_MODEL_LIMIT:
      return `Maximum output tokens value exceeded the model limit: ${selectedModel?.max_output_tokens}`;
    case VALIDATION_RULE.REASONING_MIN_TOKENS:
      return `Minimum ${REASONING_MIN_TOKENS} tokens required for reasoning models`;
    case VALIDATION_RULE.VALID:
    default:
      return undefined;
  }
};
