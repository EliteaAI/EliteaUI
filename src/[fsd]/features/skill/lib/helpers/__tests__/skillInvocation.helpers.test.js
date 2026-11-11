import { describe, expect, it } from 'vitest';

import {
  isUserInvocable,
  userInvocableMeta,
  withSkillVersionInvocation,
} from '@/[fsd]/features/skill/lib/helpers/skillInvocation.helpers';

const modelOnly = { meta: { frontmatter: { 'user-invocable': false } } };
const plain = { meta: { frontmatter: { license: 'MIT' } } };

describe('userInvocableMeta', () => {
  it('marks a version whose frontmatter turns user invocation off', () => {
    expect(userInvocableMeta(modelOnly)).toEqual({ user_invocable: false });
  });

  it.each([plain, { meta: { frontmatter: { 'user-invocable': true } } }, {}, undefined])(
    'adds nothing for any other version %#',
    versionDetails => {
      expect(userInvocableMeta(versionDetails)).toEqual({});
    },
  );
});

describe('withSkillVersionInvocation', () => {
  it('sets the flag when switching to a model-only version', () => {
    expect(withSkillVersionInvocation({ name: 'style', mcp: false }, modelOnly)).toEqual({
      name: 'style',
      mcp: false,
      user_invocable: false,
    });
  });

  it('drops the flag when switching to a version without it', () => {
    expect(withSkillVersionInvocation({ name: 'style', user_invocable: false }, plain)).toEqual({
      name: 'style',
    });
  });
});

describe('isUserInvocable', () => {
  it('hides only an explicit false', () => {
    expect(isUserInvocable({ user_invocable: false })).toBe(false);
    expect(isUserInvocable({})).toBe(true);
    expect(isUserInvocable(undefined)).toBe(true);
  });
});
