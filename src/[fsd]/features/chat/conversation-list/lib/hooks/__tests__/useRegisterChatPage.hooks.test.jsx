// @vitest-environment jsdom
import { useRef, useState } from 'react';

import { afterEach, describe, expect, it } from 'vitest';

import { act, cleanup, render, renderHook } from '@testing-library/react';

import { EMPTY_CHAT_PAGE_STATE } from '../../constants';
import { ChatHistoryActionsContext } from '../../context';
import { useChatHistoryActions } from '../useChatHistory.hooks';
import { useRegisterChatPage } from '../useRegisterChatPage.hooks';

const renderWithHistory = initialProps => {
  const probe = {};

  const Wrapper = ({ children }) => {
    const [chatPageState, setChatPageState] = useState(EMPTY_CHAT_PAGE_STATE);
    const chatPageActionsRef = useRef(null);
    probe.chatPageState = chatPageState;
    probe.chatPageActionsRef = chatPageActionsRef;
    return (
      <ChatHistoryActionsContext.Provider value={{ chatPageActionsRef, setChatPageState }}>
        {children}
      </ChatHistoryActionsContext.Provider>
    );
  };

  const hook = renderHook(props => useRegisterChatPage(props), { wrapper: Wrapper, initialProps });
  return { ...hook, probe };
};

describe('useRegisterChatPage', () => {
  afterEach(() => cleanup());

  it('hands the page handlers and the open chat to the menu', () => {
    const onDeleteConversation = () => 'deleted';
    const { probe } = renderWithHistory({
      actions: { onDeleteConversation },
      selectedConversationId: '12',
      duplicatingConversationId: 4,
    });

    expect(probe.chatPageActionsRef.current.onDeleteConversation).toBe(onDeleteConversation);
    expect(probe.chatPageState).toEqual({
      isMounted: true,
      selectedConversationId: '12',
      duplicatingConversationId: 4,
    });
  });

  it('keeps the latest handlers without a state change', () => {
    const { probe, rerender } = renderWithHistory({
      actions: { onPin: () => 1 },
      selectedConversationId: '12',
    });
    const stateBefore = probe.chatPageState;
    const onPin = () => 2;

    rerender({ actions: { onPin }, selectedConversationId: '12' });

    expect(probe.chatPageActionsRef.current.onPin).toBe(onPin);
    expect(probe.chatPageState).toBe(stateBefore);
  });

  it('clears everything when the page closes, so nothing is highlighted elsewhere', () => {
    const probe = {};
    const ChatPage = () => {
      useRegisterChatPage({ actions: {}, selectedConversationId: '12' });
      return null;
    };
    const Host = ({ showPage }) => {
      const [chatPageState, setChatPageState] = useState(EMPTY_CHAT_PAGE_STATE);
      const chatPageActionsRef = useRef(null);
      probe.chatPageState = chatPageState;
      probe.chatPageActionsRef = chatPageActionsRef;
      return (
        <ChatHistoryActionsContext.Provider value={{ chatPageActionsRef, setChatPageState }}>
          {showPage && <ChatPage />}
        </ChatHistoryActionsContext.Provider>
      );
    };

    const { rerender } = render(<Host showPage />);
    expect(probe.chatPageState.isMounted).toBe(true);

    act(() => rerender(<Host showPage={false} />));

    expect(probe.chatPageActionsRef.current).toBeNull();
    expect(probe.chatPageState).toEqual(EMPTY_CHAT_PAGE_STATE);
  });

  it('throws outside the provider', () => {
    expect(() => renderHook(() => useChatHistoryActions())).toThrow(/ChatHistoryProvider/);
  });
});
