import { describe, expect, it } from 'vitest';

import SkillValidateSchema from '../skillValidationSchema.validation';

const SAVED = { name: 'old--name', description: 'Use <b> carefully' };

const fieldError = async (field, values, saved) => {
  const skill = {
    name: 'reviewer',
    description: 'Reviews code',
    version_details: { instructions: 'i' },
    ...values,
  };
  try {
    await SkillValidateSchema(50000, undefined, saved).validate(skill, { abortEarly: false });
    return null;
  } catch (error) {
    return error.inner.find(issue => issue.path === field)?.message ?? null;
  }
};

describe('SkillValidateSchema Agent Skills spec rules', () => {
  it('rejects a new name with consecutive hyphens', async () => {
    expect(await fieldError('name', { name: 'my--skill' })).toBe(
      'Name cannot contain consecutive hyphens (--)',
    );
  });

  it('rejects a new description with angle brackets', async () => {
    expect(await fieldError('description', { description: 'Use <tag>' })).toBe(
      'Description cannot contain angle brackets (< or >)',
    );
  });

  it('accepts the saved name and description even though they break the rules', async () => {
    expect(await fieldError('name', SAVED, SAVED)).toBeNull();
    expect(await fieldError('description', SAVED, SAVED)).toBeNull();
  });

  it('rejects a changed value that still breaks the rules', async () => {
    expect(await fieldError('name', { name: 'new--name' }, SAVED)).toBe(
      'Name cannot contain consecutive hyphens (--)',
    );
    expect(await fieldError('description', { description: 'a > b' }, SAVED)).toBe(
      'Description cannot contain angle brackets (< or >)',
    );
  });

  it('accepts a description over the spec limit', async () => {
    expect(await fieldError('description', { description: 'd'.repeat(1500) })).toBeNull();
  });
});
