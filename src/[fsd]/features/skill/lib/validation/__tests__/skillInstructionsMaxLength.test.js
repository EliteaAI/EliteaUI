import { describe, expect, it } from 'vitest';

import { validateSkillDraft } from '@/[fsd]/features/skill/lib/helpers';

import SkillValidateSchema from '../skillValidationSchema.validation';

const LIMIT = 1200;

const validSkill = instructions => ({
  name: 'reviewer',
  description: 'Reviews code',
  version_details: { instructions },
});

const instructionsError = async (instructions, limit = LIMIT, savedInstructions) => {
  try {
    await SkillValidateSchema(limit, savedInstructions).validate(validSkill(instructions), {
      abortEarly: false,
    });
    return null;
  } catch (error) {
    return error.inner.find(issue => issue.path === 'version_details.instructions')?.message ?? null;
  }
};

describe('SkillValidateSchema instructions limit', () => {
  it('accepts instructions at the configured limit', async () => {
    expect(await instructionsError('i'.repeat(LIMIT))).toBeNull();
  });

  it('rejects instructions over the limit, naming the current length and the limit', async () => {
    expect(await instructionsError('i'.repeat(LIMIT + 1))).toBe(
      'Instructions are 1201 characters long. Maximum allowed is 1200 characters.',
    );
  });

  it('accepts more than the old 5000-character cap when the limit allows it', async () => {
    expect(await instructionsError('i'.repeat(50000), 50000)).toBeNull();
  });

  it('accepts unchanged instructions saved before the limit was lowered', async () => {
    const saved = 'i'.repeat(LIMIT + 300);

    expect(await instructionsError(saved, LIMIT, saved)).toBeNull();
  });

  it('rejects a whitespace-only edit to instructions saved before the limit was lowered', async () => {
    const saved = `${'i'.repeat(LIMIT + 300)}\n`;

    expect(await instructionsError(saved.trimEnd(), LIMIT, saved)).toBe(
      'Instructions are 1500 characters long. Maximum allowed is 1200 characters.',
    );
  });

  it('rejects new instructions that exceed the limit only by trailing whitespace', async () => {
    expect(await instructionsError(`${'i'.repeat(LIMIT)}\n`)).toBe(
      'Instructions are 1201 characters long. Maximum allowed is 1200 characters.',
    );
  });

  it('accepts unchanged saved instructions that end in whitespace', async () => {
    const saved = `${'i'.repeat(LIMIT + 300)}\n`;

    expect(await instructionsError(saved, LIMIT, saved)).toBeNull();
  });

  it('rejects an edit to instructions saved before the limit was lowered while still over it', async () => {
    const saved = 'i'.repeat(LIMIT + 300);

    expect(await instructionsError(saved.slice(1), LIMIT, saved)).toBe(
      'Instructions are 1499 characters long. Maximum allowed is 1200 characters.',
    );
  });
});

describe('validateSkillDraft instructions limit', () => {
  const draft = instructions => ({ name: 'reviewer', description: 'Reviews code', instructions });

  it('accepts a generated draft at the configured limit', () => {
    expect(validateSkillDraft(draft('i'.repeat(LIMIT)), LIMIT)).toEqual({});
  });

  it('rejects a generated draft over the limit, naming the current length and the limit', () => {
    expect(validateSkillDraft(draft('i'.repeat(LIMIT + 1)), LIMIT).instructions).toBe(
      'Instructions are 1201 characters long. Maximum allowed is 1200 characters.',
    );
  });
});
