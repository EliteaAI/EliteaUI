// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { act, cleanup, render, screen } from '@testing-library/react';

import SkillRunPanel from '../SkillRunPanel';

const fixture = vi.hoisted(() => ({ runChat: {} }));

vi.hoisted(() => vi.stubEnv('VITE_SERVER_URL', 'http://localhost/api/v2/'));
vi.mock('@/[fsd]/features/chat/ui', () => ({
  ChatBox: () => <div data-testid="chat-box" />,
}));
vi.mock('@/[fsd]/features/skill/lib/hooks', () => ({
  useSkillRunChat: () => fixture.runChat,
  useFocusRunInput: () => {},
  useSkillVersionModel: () => ({ canEditVersionModel: false }),
}));
vi.mock('@/hooks/chat/useUploadAttachments', () => ({ default: () => ({}) }));
vi.mock('@/[fsd]/shared/lib/hooks/useSelectedProject.hooks', () => ({ useSelectedProjectId: () => 2 }));

const theme = createTheme({ palette: lightPalette });
const runWithMessages = {
  id: 1780,
  chat_history: [
    { id: 'm1', role: 'user', content: 'hi' },
    { id: 'm2', role: 'assistant', content: 'Hello' },
  ],
};

const setRunChat = overrides => {
  fixture.runChat = {
    activeConversation: runWithMessages,
    activeParticipant: { id: 601 },
    isStreaming: false,
    isReadOnly: false,
    onStartNewRun: vi.fn(),
    onDeleteAllMessages: vi.fn(),
    ...overrides,
  };
};

const renderPanel = () => {
  const ref = { current: null };
  const onClearStateChange = vi.fn();
  const onContextConversationChange = vi.fn();
  const view = render(
    <ThemeProvider theme={theme}>
      <SkillRunPanel
        ref={ref}
        skillId={601}
        skillName="Reviewer"
        onClearStateChange={onClearStateChange}
        onContextConversationChange={onContextConversationChange}
      />
    </ThemeProvider>,
  );
  return { ref, onClearStateChange, onContextConversationChange, unmount: view.unmount };
};

const clear = ref => {
  act(() => {
    ref.current.clear();
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  setRunChat();
});
afterEach(cleanup);

describe('SkillRunPanel clear the chat', () => {
  it('leaves the chat controls to the Test panel toolbar', () => {
    renderPanel();

    expect(screen.queryByTestId('skill-run-new-run-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('chat-clear-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('skill-run-history-button')).not.toBeInTheDocument();
  });

  it('starts a fresh run like agents do, without deleting the messages', () => {
    const { ref } = renderPanel();

    clear(ref);

    expect(fixture.runChat.onStartNewRun).toHaveBeenCalledTimes(1);
    expect(fixture.runChat.onDeleteAllMessages).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('lets a read-only run be cleared to start an own run', () => {
    setRunChat({ isReadOnly: true });
    const { ref, onClearStateChange } = renderPanel();

    expect(onClearStateChange).toHaveBeenLastCalledWith(false);
    clear(ref);

    expect(fixture.runChat.onStartNewRun).toHaveBeenCalledTimes(1);
  });

  it('disables clearing while the skill is answering', () => {
    setRunChat({ isStreaming: true });
    const { onClearStateChange } = renderPanel();

    expect(onClearStateChange).toHaveBeenLastCalledWith(true);
  });

  it('disables clearing on a fresh chat with no messages', () => {
    setRunChat({ activeConversation: { chat_history: [] } });
    const { onClearStateChange } = renderPanel();

    expect(onClearStateChange).toHaveBeenLastCalledWith(true);
  });

  it('enables clearing once a new run has messages, before it is saved', () => {
    setRunChat({ activeConversation: { chat_history: runWithMessages.chat_history } });
    const { onClearStateChange } = renderPanel();

    expect(onClearStateChange).toHaveBeenLastCalledWith(false);
  });

  it('lets a saved run without messages be cleared to start a fresh run', () => {
    setRunChat({ activeConversation: { id: 1780, chat_history: [] }, isReadOnly: true });
    const { ref, onClearStateChange } = renderPanel();

    expect(onClearStateChange).toHaveBeenLastCalledWith(false);
    clear(ref);

    expect(fixture.runChat.onStartNewRun).toHaveBeenCalledTimes(1);
  });
});

describe('SkillRunPanel context pill', () => {
  it('hands the saved run to the Test panel toolbar', () => {
    const setActiveConversation = vi.fn();
    setRunChat({
      activeConversation: {
        ...runWithMessages,
        meta: { context_strategy: { max_context_tokens: 64000 } },
        instructions: 'Be brief',
      },
      setActiveConversation,
    });
    const { onContextConversationChange } = renderPanel();

    expect(onContextConversationChange).toHaveBeenLastCalledWith({
      activeConversation: {
        id: 1780,
        meta: { context_strategy: { max_context_tokens: 64000 } },
        instructions: 'Be brief',
      },
      setActiveConversation,
    });
  });

  it('reports no run before the chat is saved', () => {
    setRunChat({ activeConversation: { chat_history: [] } });
    const { onContextConversationChange } = renderPanel();

    expect(onContextConversationChange).toHaveBeenLastCalledWith(null);
  });

  it('clears the toolbar run when the panel goes away', () => {
    const { onContextConversationChange, unmount } = renderPanel();

    unmount();

    expect(onContextConversationChange).toHaveBeenLastCalledWith(null);
  });
});
