import { describe, expect, it } from 'vitest';

import {
  argumentHintMeta,
  argumentHintText,
  isUserInvocable,
  skillComposerPlaceholder,
  skillVersionMeta,
  userInvocableMeta,
  withSkillVersionMeta,
} from '@/[fsd]/features/skill/lib/helpers/skillInvocation.helpers';

const modelOnly = { meta: { frontmatter: { 'user-invocable': false } } };
const plain = { meta: { frontmatter: { license: 'MIT' } } };
const hinted = { meta: { frontmatter: { 'argument-hint': ['city like Paris', 'Rome'] } } };

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

describe('argumentHintText', () => {
  it.each([
    ['[a] [b]', '[a] [b]'],
    ['  [name]  ', '[name]'],
    [
      ['container name like pylon_indexer', 'pylon_main', 'pylon_auth'],
      '[container name like pylon_indexer, pylon_main, pylon_auth]',
    ],
    [
      [{ optional: 'service names like "pylon_indexer pylon_main" or "all"' }],
      '[optional: service names like "pylon_indexer pylon_main" or "all"]',
    ],
    [['x', { default: 'y' }], '[x, default: y]'],
    [{ optional: 'z' }, 'optional: z'],
    [42, '42'],
    [['x', null], '[x]'],
    [['x', undefined, '', []], '[x]'],
    [{ a: null, b: 'y' }, 'b: y'],
  ])('renders the stored shape %j as one line', (value, expected) => {
    expect(argumentHintText(value)).toBe(expected);
  });

  it.each([
    ['', undefined],
    [null, undefined],
    [undefined, undefined],
    [[], undefined],
    [{}, undefined],
    [[null], undefined],
    [[[]], undefined],
    [{ a: null }, undefined],
  ])('renders nothing for the empty shape %j', (value, expected) => {
    expect(argumentHintText(value)).toBe(expected);
  });
});

describe('argumentHintMeta', () => {
  it('carries the one-line hint of a hinted version', () => {
    expect(argumentHintMeta(hinted)).toEqual({ argument_hint: '[city like Paris, Rome]' });
  });

  it.each([plain, {}, undefined])('adds nothing for a version without a hint %#', versionDetails => {
    expect(argumentHintMeta(versionDetails)).toEqual({});
  });
});

describe('skillVersionMeta', () => {
  it('combines the flag and the hint of the version', () => {
    const both = { meta: { frontmatter: { 'user-invocable': false, 'argument-hint': '[v]' } } };
    expect(skillVersionMeta(both)).toEqual({ user_invocable: false, argument_hint: '[v]' });
    expect(skillVersionMeta(plain)).toEqual({});
  });
});

describe('withSkillVersionMeta', () => {
  it('sets the flag and the hint when switching to a version that has them', () => {
    const both = { meta: { frontmatter: { 'user-invocable': false, 'argument-hint': '[v]' } } };
    expect(withSkillVersionMeta({ name: 'style', mcp: false }, both)).toEqual({
      name: 'style',
      mcp: false,
      user_invocable: false,
      argument_hint: '[v]',
    });
  });

  it('drops the flag and the hint when switching to a version without them', () => {
    expect(
      withSkillVersionMeta({ name: 'style', user_invocable: false, argument_hint: '[v]' }, plain),
    ).toEqual({
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

describe('skillComposerPlaceholder', () => {
  it('shows how to invoke the answering skill, with its hint, in place of the default prompt', () => {
    const skill = { entity_name: 'skill', meta: { name: 'greet', argument_hint: '[name]' } };
    expect(skillComposerPlaceholder(skill, 'Type your message...')).toBe('~greet [name]');
  });

  it.each([
    [{ entity_name: 'skill', meta: { name: 'plain' } }],
    [{ entity_name: 'skill', meta: { argument_hint: '[name]' } }],
    [{ entity_name: 'application', meta: { argument_hint: '[name]' } }],
    [undefined],
  ])('keeps the default prompt for %j', activeParticipant => {
    expect(skillComposerPlaceholder(activeParticipant, 'Type your message...')).toBe('Type your message...');
  });
});
