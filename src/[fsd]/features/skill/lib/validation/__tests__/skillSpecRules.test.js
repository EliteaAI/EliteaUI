import { describe, expect, it } from 'vitest';

import SkillValidateSchema from '../skillValidationSchema.validation';

const fieldError = async (field, values) => {
  const skill = {
    name: 'reviewer',
    description: 'Reviews code',
    version_details: { instructions: 'i' },
    ...values,
  };
  try {
    await SkillValidateSchema(50000).validate(skill, { abortEarly: false });
    return null;
  } catch (error) {
    return error.inner.find(issue => issue.path === field)?.message ?? null;
  }
};

describe('SkillValidateSchema Agent Skills spec rules', () => {
  it('rejects a name with consecutive hyphens', async () => {
    expect(await fieldError('name', { name: 'my--skill' })).toMatch(/consecutive hyphens/);
  });

  it('accepts a name with single hyphens', async () => {
    expect(await fieldError('name', { name: 'release-notes' })).toBeNull();
  });

  it('accepts a description with angle brackets', async () => {
    expect(await fieldError('description', { description: 'Maps a -> b and <x>' })).toBeNull();
  });

  it('accepts a description over the spec limit', async () => {
    expect(await fieldError('description', { description: 'd'.repeat(1500) })).toBeNull();
  });
});
