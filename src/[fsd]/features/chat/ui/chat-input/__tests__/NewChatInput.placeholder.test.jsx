// @vitest-environment jsdom
import { forwardRef } from 'react';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import NewChatInput from '../NewChatInput';

vi.mock('@/[fsd]/features/chat/lib/hooks', () => ({
  useChatConfig: () => ({ limits: {} }),
  useSpeakingModeLoop: () => ({
    isRecording: false,
    pauseForRegeneration: vi.fn(),
    notifyManualEdit: vi.fn(),
  }),
}));
vi.mock('@/[fsd]/features/chat/ui', () => {
  const NoButton = forwardRef(() => null);
  NoButton.displayName = 'NoButton';
  return {
    ChatButton: {
      ClearChatButton: () => null,
      AttachmentButton: NoButton,
      ChatInternalToolsConfigButton: () => null,
      VoiceButton: NoButton,
    },
  };
});
vi.mock('@/[fsd]/features/chat/ui/chat-button', () => ({
  PlusChatButton: () => null,
  SendButton: () => null,
}));
vi.mock('@/[fsd]/features/chat/ui/chat-input/AgentEditorPanel.jsx', () => ({ default: () => null }));
vi.mock('@/[fsd]/features/chat/ui/chat-input/SkillChatPanel.jsx', () => ({ default: () => null }));
vi.mock('@/[fsd]/widgets/llm-model-selector', () => ({ LLMModelSelector: () => null }));
vi.mock('@/[fsd]/features/interactive-tours', () => ({ CHAT_TOUR_TARGET_IDS: {} }));
vi.mock('@/[fsd]/shared/lib/hooks', async importOriginal => ({
  ...(await importOriginal()),
  useToast: () => ({ toastError: vi.fn() }),
}));

const theme = createTheme(getDesignTokens('dark'));

const renderInput = props =>
  render(
    <ThemeProvider theme={theme}>
      <NewChatInput {...props} />
    </ThemeProvider>,
  );

describe('NewChatInput placeholder', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('names «#» on the chat page and keeps it with the caret in the empty field', () => {
    renderInput({ fromTheChat: true });

    const field = screen.getByPlaceholderText('Type your message… # for assistants');
    fireEvent.focus(field);

    expect(screen.getByPlaceholderText('Type your message… # for assistants')).toBe(field);
  });

  it('replies to the agent that answers', () => {
    renderInput({
      fromTheChat: true,
      activeParticipant: { entity_name: 'application', meta: { name: 'Meta' } },
      activeParticipantDetails: { name: 'Jira Helper' },
    });

    expect(screen.getByPlaceholderText('Reply to Jira Helper…')).toBeInTheDocument();
  });

  it('keeps the skill argument hint the host passes', () => {
    renderInput({
      fromTheChat: true,
      placeholder: '~writer <topic>',
      activeParticipant: { entity_name: 'skill', meta: { name: 'writer' } },
    });

    expect(screen.getByPlaceholderText('~writer <topic>')).toBeInTheDocument();
  });

  it('keeps the host placeholder outside the chat page, also with focus', () => {
    renderInput({ placeholder: 'Type your message...', isAgentsPage: true });

    const field = screen.getByPlaceholderText('Type your message...');
    fireEvent.focus(field);

    expect(field).toHaveAttribute('placeholder', 'Type your message...');
  });
});
