import { describe, expect, it, vi } from 'vitest';

vi.mock('@/common/constants', () => ({ WELCOME_MESSAGE_ID: 'welcome' }));

const { isTestChatClearDisabled } = await import('../testChat.helpers');

describe('isTestChatClearDisabled', () => {
  it('is disabled without messages', () => {
    expect(isTestChatClearDisabled(undefined, false)).toBe(true);
    expect(isTestChatClearDisabled([], false)).toBe(true);
  });

  it('is disabled when only the welcome message is shown', () => {
    expect(isTestChatClearDisabled([{ id: 'welcome' }], false)).toBe(true);
  });

  it('is disabled while answering', () => {
    expect(isTestChatClearDisabled([{ id: 1 }], true)).toBe(true);
  });

  it('is enabled once the chat has messages', () => {
    expect(isTestChatClearDisabled([{ id: 1 }], false)).toBe(false);
    expect(isTestChatClearDisabled([{ id: 'welcome' }, { id: 2 }], false)).toBe(false);
  });
});
