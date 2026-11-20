// @vitest-environment jsdom
import { useContext } from 'react';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { cleanup, render } from '@testing-library/react';

const fixture = vi.hoisted(() => ({ projectId: 1, actions: null }));

vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSelectedProjectId: () => fixture.projectId,
  useToastHandlers: () => ({ toastError: vi.fn() }),
}));
vi.mock('@/[fsd]/features/chat/conversation-list/lib/hooks', () => ({
  useLoadChatHistory: () => ({}),
  useDateGroupExpansion: () => ({}),
}));

const { ChatHistoryActionsContext } = await import('@/[fsd]/features/chat/conversation-list/lib/context');
const { default: ChatHistoryProvider } = await import('../ChatHistoryProvider');

const Probe = () => {
  fixture.actions = useContext(ChatHistoryActionsContext);
  return null;
};

const renderProvider = () => {
  const element = () => (
    <ChatHistoryProvider>
      <Probe />
    </ChatHistoryProvider>
  );
  const view = render(element());
  return () => view.rerender(element());
};

describe('ChatHistoryProvider', () => {
  afterEach(() => {
    cleanup();
    fixture.projectId = 1;
  });

  it('keeps the folder states and the scroll position until the project changes', () => {
    const rerender = renderProvider();
    fixture.actions.folderExpansionRef.current.set(200, true);
    fixture.actions.historyScrollTopRef.current = 240;

    rerender();
    expect(fixture.actions.folderExpansionRef.current.get(200)).toBe(true);
    expect(fixture.actions.historyScrollTopRef.current).toBe(240);

    fixture.projectId = 2;
    rerender();
    expect(fixture.actions.folderExpansionRef.current.size).toBe(0);
    expect(fixture.actions.historyScrollTopRef.current).toBe(0);
  });
});
