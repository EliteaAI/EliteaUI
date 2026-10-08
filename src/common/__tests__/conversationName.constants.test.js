import { describe, expect, it } from 'vitest';

import { ConversationNameRegExp } from '@/common/constants';

describe('ConversationNameRegExp', () => {
  it.each([
    "Bob's chat: plan x",
    'What is AI?',
    'Привіт світ',
    '/Monday/list_users_and_teams',
    'Report & summary',
    'New Chat',
    'abc',
    'Emoji 🚀 name',
    'a'.repeat(64),
  ])('accepts "%s"', name => {
    expect(ConversationNameRegExp.test(name)).toBe(true);
  });

  it.each(['', 'ab', ' abc', '\tabc', 'abc\ndef', 'a'.repeat(65)])('rejects %j', name => {
    expect(ConversationNameRegExp.test(name)).toBe(false);
  });
});
