import { describe, expect, it } from 'vitest';

import { autoModel } from '@/[fsd]/shared/lib/utils/autoRouting.utils';

import { VALIDATION_RULE, validateMaxTokens } from '../validation';

describe('model output limit validation', () => {
  it('does not apply a fictional model ceiling to Auto', () => {
    expect(validateMaxTokens(64000, autoModel())).toBe(VALIDATION_RULE.VALID);
  });
  it('retains concrete model limits and the Default sentinel', () => {
    const model = { max_output_tokens: 8192, supports_reasoning: true };
    expect(validateMaxTokens(16000, model)).toBe(VALIDATION_RULE.EXCEEDS_MODEL_LIMIT);
    expect(validateMaxTokens(1000, model)).toBe(VALIDATION_RULE.REASONING_MIN_TOKENS);
    expect(validateMaxTokens(-1, model)).toBe(VALIDATION_RULE.VALID);
  });
});
