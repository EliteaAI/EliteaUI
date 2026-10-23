import { describe, expect, it } from 'vitest';

import { VALIDATION_LIMITS } from '../constants';
import { validateField } from '../validation';

const { MIN, MAX } = VALIDATION_LIMITS.MANUAL_MAX_CONTEXT_TOKENS;

describe('manual_max_context_tokens validation', () => {
  it('accepts empty value', async () => {
    expect(await validateField('manual_max_context_tokens', null)).toBeNull();
  });

  it('accepts the bounds', async () => {
    expect(await validateField('manual_max_context_tokens', MIN)).toBeNull();
    expect(await validateField('manual_max_context_tokens', MAX)).toBeNull();
  });

  it('rejects values below the minimum', async () => {
    expect(await validateField('manual_max_context_tokens', MIN - 1)).toBe(`Must be at least ${MIN}`);
  });

  it('rejects values above the maximum', async () => {
    expect(await validateField('manual_max_context_tokens', MAX + 1)).toMatch(/^Cannot exceed/);
  });
});
