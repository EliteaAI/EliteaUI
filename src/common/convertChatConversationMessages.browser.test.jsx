import { act, createRef } from 'react';

import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material/styles';

import ChatMessageWrapper from '@/[fsd]/features/chat/ui/chat-box/ChatMessageWrapper';
import darkPalette from '@/darkPalette';
import { configureStore } from '@reduxjs/toolkit';

import { convertConversationToChatHistory } from './convertChatConversationMessages';

vi.mock('@/[fsd]/features/chat/lib/helpers/hitl.helpers.js', async importOriginal => ({
  ...(await importOriginal()),
  getPendingHitlMessage: () => null,
}));

// Keep the actual ChatMessageWrapper -> ApplicationAnswer ->
// ApplicationThinkView -> ActionView path. Only unrelated network/store leaves
// are isolated so this focused browser proof cannot make backend requests.
vi.mock('@/[fsd]/features/chat/participants/lib/hooks', () => ({
  useParticipantEntityIcon: () => ({}),
  useParticipantName: participant => participant?.meta?.name || 'configurations',
}));

vi.mock('@/[fsd]/features/chat/ui', () => ({
  ChatAttachment: { ImageAttachment: () => null },
  ChatBox: () => null,
  ChatButton: {},
  ChatContinue: () => null,
  ChatHitlActions: () => null,
  ChatModal: {},
  ErrorTrace: () => null,
  SlashSuggestionList: () => null,
  SubAgentAccordion: () => null,
  VoiceConfigControls: () => null,
  VoiceConfigDialog: () => null,
  VoiceControlButton: () => null,
  VoiceMiniPlayer: () => null,
  VoicePersonalizationSection: () => null,
}));

vi.mock('@/[fsd]/shared/ui', () => ({
  Accordion: {},
  Autocomplete: {},
  Banner: {},
  Button: {
    BaseBtn: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  Category: {},
  Checkbox: {},
  Chip: {},
  Controls: {},
  Field: {},
  Filter: {},
  Icon: {},
  Input: {},
  Label: {},
  Mention: {},
  Modal: {},
  SecretField: {},
  Select: {},
  Switch: {},
  Tab: {},
  Text: {},
  Tooltip: {},
}));

vi.mock('@/[fsd]/app/store', () => ({
  default: {
    dispatch: () => null,
    getState: () => ({}),
    subscribe: () => () => null,
  },
}));

vi.mock('@/api', () => {
  const eliteaApi = {
    injectEndpoints: () => ({}),
  };
  eliteaApi.enhanceEndpoints = () => eliteaApi;
  return {
    TAG_MODELS: 'TAG_MODELS',
    eliteaApi,
    useDeleteConfigurationMutation: () => [() => Promise.resolve({})],
    useGetConfigurationsBySectionQuery: () => ({ data: [] }),
    useLazyMessageTraceQuery: () => [() => Promise.resolve({ data: {} }), { isFetching: false }],
    useStopChatTaskMutation: () => [() => Promise.resolve({})],
  };
});

vi.mock('@/api/configurations', () => ({
  useBatchTestConfigurationConnectionMutation: () => [() => Promise.resolve({})],
  useCreateConfigurationMutation: () => [() => Promise.resolve({})],
  useDeleteConfigurationMutation: () => [() => Promise.resolve({})],
  useGetAvailableConfigurationsTypeQuery: () => ({ data: [] }),
  useGetConfigurationDetailQuery: () => ({ data: null }),
  useGetConfigurationsByTypeQuery: () => ({ data: [] }),
  useGetConfigurationsListQuery: () => ({ data: { rows: [] } }),
  useLazyGetConfigurationsListQuery: () => [() => Promise.resolve({ data: { rows: [] } })],
  useLazyListModelsQuery: () => [() => Promise.resolve({ data: { items: [] } })],
  useListCredentialTypesQuery: () => ({ data: [] }),
  useListModelsQuery: () => ({ data: { items: [] } }),
  useMakeConfigurationDefaultMutation: () => [() => Promise.resolve({})],
  useTestConfigurationConnectionMutation: () => [() => Promise.resolve({})],
  useUpdateConfigurationMutation: () => [() => Promise.resolve({})],
}));

vi.mock('@/components/Chat/ToolModal', () => ({
  default: () => null,
}));

vi.mock('@/components/Canvas', () => ({
  default: () => null,
}));

vi.mock('@/components/Chat/EditingPlaceholder', () => ({
  default: () => null,
}));

vi.mock('@/components/Chat/NormalAttachment', () => ({
  default: () => null,
}));

vi.mock('@/components/EntityIcon', () => ({
  default: () => <span aria-hidden="true" />,
}));

vi.mock('@/components/RotatingMessages', () => ({
  default: () => null,
}));

vi.mock('@/assets/arrow-right-icon.svg?react', () => ({
  default: props => (
    <svg
      aria-hidden="true"
      {...props}
    />
  ),
}));

vi.mock('@/hooks/useSelectedProject', async importOriginal => ({
  ...(await importOriginal()),
  useSelectedProjectId: () => 1,
}));

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

  it('renders one assistant Activity with current tool and thinking pins and no user row', async () => {
    const participants = [
      { id: 11, entity_name: 'user', entity_meta: { id: 7 }, meta: { user_name: 'User' } },
      {
        id: 22,
        entity_name: 'toolkit',
        entity_meta: { id: 5 },
        entity_settings: { toolkit_type: 'github' },
        meta: { name: 'configurations' },
      },
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
    const history = convertConversationToChatHistory({ message_groups: messageGroups, participants }, [
      {
        id: 51,
        message_group_id: 31,
        kind: 'tool_call',
        run_id: '00000000-0000-0000-0000-000000000001',
        tool_name: 'index_data',
        started_at: '2026-07-27T10:00:00Z',
        finished_at: '2026-07-27T10:00:02Z',
        is_error: false,
        has_visible_content: true,
        step_type: null,
        model_name: null,
        finish_reason: 'stop',
        attrs: {
          metadata: {
            initiator: 'user',
            tool_name: 'index_data',
            display_name: 'configurations',
          },
        },
      },
      {
        id: 52,
        message_group_id: 31,
        kind: 'thinking_step',
        run_id: '00000000-0000-0000-0000-000000000001',
        step_type: null,
        model_name: null,
        started_at: '2026-07-27T10:00:01Z',
        finished_at: '2026-07-27T10:00:01Z',
        is_error: false,
        has_visible_content: true,
        attrs: { response_metadata: { tool_name: 'loader' } },
      },
    ]);
    const store = configureStore({
      reducer: {
        user: () => ({ id: 7 }),
        chat: () => ({ messageIdToView: '' }),
        settings: () => ({ mode: 'dark' }),
      },
    });

    await act(async () => {
      root.render(
        <Provider store={store}>
          <ThemeProvider theme={createTheme({ palette: { ...darkPalette, mode: 'dark' } })}>
            <ChatMessageWrapper
              message={history[0]}
              index={0}
              chat_history={history}
              activeConversation={{
                id: 71,
                uuid: 'conversation-71',
                author_id: 7,
                participants,
              }}
              askingQuestionId=""
              questionItemRef={createRef()}
              listRefs={{ current: [] }}
              onCopyToClipboard={() => null}
              canDeleteAllMessage={false}
              userId={7}
              onRegenerateAnswer={() => null}
              isLoading={false}
              isStreaming={false}
              toolsFromConversation={[participants[1]]}
              subAgentTypeByName={{}}
            />
          </ThemeProvider>
        </Provider>,
      );
    });

    expect(history).toHaveLength(1);
    expect(history[0].role).toBe('assistant');
    expect(history.filter(message => message.role === 'user')).toHaveLength(0);
    expect(history[0].toolActions).toHaveLength(2);
    expect(container.querySelectorAll('[data-testid="chat-message-item"]')).toHaveLength(1);
    expect(container.textContent).toContain('Successfully indexed 10 files.');
    expect(container.textContent).toContain('Thought for');
    expect(container.textContent).not.toContain('User No Longer Available');

    const thoughtSummary = Array.from(container.querySelectorAll('button')).find(element =>
      element.textContent?.includes('Thought for'),
    );
    expect(thoughtSummary).toBeTruthy();
    await act(async () => {
      thoughtSummary.click();
      await new Promise(resolve => setTimeout(resolve, 300));
    });

    expect(container.textContent).toContain('configurations: index_data');
    expect(container.textContent).toContain('loader');
  });
});
