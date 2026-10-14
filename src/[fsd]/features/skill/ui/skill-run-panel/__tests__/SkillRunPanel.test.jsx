// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SkillRunPanel from '../SkillRunPanel';

const fixture = vi.hoisted(() => ({ runChat: {} }));

vi.hoisted(() => vi.stubEnv('VITE_SERVER_URL', 'http://localhost/api/v2/'));
vi.mock('@/[fsd]/features/chat/ui', async () => ({
  ChatBox: () => <div data-testid="chat-box" />,
  ChatButton: {
    ClearChatButton: (await import('@/[fsd]/features/chat/ui/chat-button/ClearChatButton')).default,
  },
}));
vi.mock('@/[fsd]/features/skill/lib/hooks', () => ({
  useSkillRunChat: () => fixture.runChat,
  useFocusRunInput: () => {},
}));
vi.mock('@/[fsd]/shared/ui/button', async importOriginal => ({
  ...(await importOriginal()),
  ViewRunHistoryButton: () => <div data-testid="skill-run-history-button" />,
}));
vi.mock('@/[fsd]/widgets/context-budget', () => ({
  ContextBudgetUI: { ContextBudgetInfo: () => null },
}));
vi.mock('@/components/Chat/FullScreenToggle', () => ({ default: () => null }));
vi.mock('@/hooks/chat/useUploadAttachments', () => ({ default: () => ({}) }));
vi.mock('@/hooks/useSelectedProject', () => ({ useSelectedProjectId: () => 2 }));

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

const renderPanel = () =>
  render(
    <ThemeProvider theme={theme}>
      <SkillRunPanel
        skillId={601}
        skillName="Reviewer"
        onShowHistory={vi.fn()}
      />
    </ThemeProvider>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  setRunChat();
});
afterEach(cleanup);

describe('SkillRunPanel clear the chat', () => {
  it('shows the shared Clear the chat button next to New run and Run History', async () => {
    renderPanel();

    expect(screen.getByTestId('skill-run-new-run-button')).toBeEnabled();

    const clearButton = screen.getByTestId('chat-clear-button');
    expect(clearButton).toHaveAccessibleName('clear the chat');
    expect(screen.getByTestId('skill-run-history-button')).toBeInTheDocument();

    await userEvent.hover(clearButton);
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Clear the chat');
  });

  it('starts a fresh run like agents do, without deleting the messages', async () => {
    renderPanel();

    await userEvent.click(screen.getByTestId('chat-clear-button'));

    expect(fixture.runChat.onStartNewRun).toHaveBeenCalledTimes(1);
    expect(fixture.runChat.onDeleteAllMessages).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('lets a read-only run be cleared to start an own run', async () => {
    setRunChat({ isReadOnly: true });
    renderPanel();

    await userEvent.click(screen.getByTestId('chat-clear-button'));

    expect(fixture.runChat.onStartNewRun).toHaveBeenCalledTimes(1);
  });

  it('disables clearing while the skill is answering', () => {
    setRunChat({ isStreaming: true });
    renderPanel();

    expect(screen.getByTestId('chat-clear-button')).toBeDisabled();
  });

  it('disables clearing when the run has no messages', () => {
    setRunChat({ activeConversation: { id: 1780, chat_history: [] } });
    renderPanel();

    expect(screen.getByTestId('chat-clear-button')).toBeDisabled();
  });
});
