import { act, createRef } from 'react';

import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import { configureStore } from '@reduxjs/toolkit';

import ChatMessageList from '@/[fsd]/features/chat/ui/chat-box/ChatMessageList';

import { convertConversationToChatHistory } from './convertChatConversationMessages';

vi.mock('@/[fsd]/features/chat/lib/helpers/hitl.helpers.js', () => ({
  getPendingHitlMessage: () => null,
  normalizeHitlInterrupt: value => value,
}));

vi.mock('@/[fsd]/features/chat/ui/chat-box/ChatMessageWrapper', () => ({
  default: ({ message }) => {
    const persistedContent = message.message_items
      ?.map(item => item.item_details?.content)
      .filter(Boolean)
      .join('');

    return (
      <article data-testid={`${message.role}-activity`}>
        {message.content || persistedContent}
      </article>
    );
  },
}));

vi.mock('@/[fsd]/shared/ui', async () => {
  const { forwardRef, useImperativeHandle, useRef } = await import('react');

  return {
    ScrollableContainer: forwardRef(({ children }, ref) => {
      const elementRef = useRef(null);
      useImperativeHandle(ref, () => ({
        getScrollElement: () => elementRef.current,
      }));
      return <div ref={elementRef}>{children}</div>;
    }),
  };
});

vi.mock('@/components/Chat/StyledComponents', () => ({
  MessageList: ({ children, ...props }) => <div {...props}>{children}</div>,
}));

vi.mock('@/slices/chat', () => {
  const initialState = { messageIdToView: '' };

  return {
    default: (state = initialState) => state,
    actions: {
      setMessageIdToView: payload => ({ type: 'chat/setMessageIdToView', payload }),
    },
    selectMessageIdToView: state => state.chat.messageIdToView,
  };
});

describe('reloaded index Activity rendering', () => {
  let container;
  let root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it('mounts one assistant Activity from the current DTO without a synthetic user row', async () => {
    const participants = [
      { id: 11, entity_name: 'user', entity_meta: { id: 7 }, meta: { user_name: 'User' } },
      { id: 22, entity_name: 'toolkit', entity_meta: { id: 5 }, meta: { name: 'configurations' } },
    ];
    const messageGroups = [
      {
        id: 31,
        uuid: '4f135e13-c74a-eef2-4035-bdd9e5224001',
        author_participant_id: 22,
        sent_to_id: null,
        sent_to: null,
        reply_to_id: null,
        task_id: 'index-execution-1',
        created_at: '2026-07-27T10:00:00Z',
        updated_at: '2026-07-27T10:00:02Z',
        is_streaming: false,
        meta: {
          activity_kind: 'indexing',
          context: { included: true, priority: 1, weight: 1 },
          is_error: false,
        },
        message_items: [
          {
            id: 41,
            uuid: '4f135e13-c74a-eef2-4035-bdd9e5224001',
            item_type: 'text_message',
            order_index: 0,
            meta: {},
            item_details: {
              item_type: 'text_message',
              content: 'Successfully indexed 10 files.',
            },
          },
        ],
      },
    ];
    const history = convertConversationToChatHistory(
      { message_groups: messageGroups, participants },
      [
        {
          id: 52,
          message_group_id: 31,
          kind: 'thinking_step',
          run_id: 'run-1',
          model_name: 'index-progress-model',
          started_at: '2026-07-27T10:00:01Z',
          finished_at: '2026-07-27T10:00:01Z',
          attrs: { response_metadata: { tool_name: 'loader' } },
        },
      ],
    );
    const store = configureStore({
      reducer: {
        user: () => ({ id: 7 }),
        chat: () => ({ messageIdToView: '' }),
      },
    });

    await act(async () => {
      root.render(
        <Provider store={store}>
          <ThemeProvider theme={createTheme()}>
            <ChatMessageList
              chat_history={history}
              activeConversation={{ id: 71, author_id: 7, participants }}
              isLoading={false}
              isStreaming={false}
              isLoadingMore={false}
              askingQuestionId=""
              questionItemRef={createRef()}
              onCopyToClipboard={() => null}
              onRegenerateAnswer={() => null}
            />
          </ThemeProvider>
        </Provider>,
      );
    });

    expect(history).toHaveLength(1);
    expect(history[0].role).toBe('assistant');
    expect(container.querySelectorAll('[data-testid="chat-message-list"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-testid="assistant-activity"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-testid="user-activity"]')).toHaveLength(0);
    expect(container.textContent).toContain('Successfully indexed 10 files.');
    expect(container.textContent).not.toContain('User No Longer Available');
  });
});
