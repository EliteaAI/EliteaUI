// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { cleanup, renderHook } from '@testing-library/react';

import { useSkillValidationSchema } from '../useSkillValidationSchema.hooks';

vi.mock('../useSkillInstructionsMaxLength.hooks', () => ({ useSkillInstructionsMaxLength: () => 50000 }));

const SAVED_SKILL = {
  name: 'old--name',
  description: 'Use <b> carefully',
  version_details: { instructions: 'Do it.' },
};

describe('useSkillValidationSchema', () => {
  afterEach(() => cleanup());

  it('lets the saved skill pass the spec rules it already breaks', async () => {
    const { result } = renderHook(() => useSkillValidationSchema(SAVED_SKILL));

    await expect(result.current.validate(SAVED_SKILL)).resolves.toBeTruthy();
  });

  it('applies the spec rules to a new skill', async () => {
    const { result } = renderHook(() => useSkillValidationSchema());

    await expect(result.current.validate(SAVED_SKILL, { abortEarly: false })).rejects.toMatchObject({
      errors: [
        'Name cannot contain consecutive hyphens (--)',
        'Description cannot contain angle brackets (< or >)',
      ],
    });
  });
});
