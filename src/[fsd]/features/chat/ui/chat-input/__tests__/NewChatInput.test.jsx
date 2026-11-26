// @vitest-environment jsdom
import { forwardRef } from 'react';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import { ContextBudgetUI } from '@/[fsd]/widgets/context-budget';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';

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
  const VoiceButton = forwardRef(() => <span data-testid="voice-button" />);
  VoiceButton.displayName = 'VoiceButton';
  const NoButton = forwardRef(() => null);
  NoButton.displayName = 'NoButton';
  return {
    ChatButton: {
      ClearChatButton: () => null,
      AttachmentButton: NoButton,
      ChatInternalToolsConfigButton: () => null,
      VoiceButton,
    },
  };
});
vi.mock('@/[fsd]/features/chat/ui/chat-button', () => ({
  PlusChatButton: () => null,
  SendButton: () => null,
}));
vi.mock('@/[fsd]/features/chat/ui/chat-input/AgentEditorPanel.jsx', () => ({
  default: () => <span data-testid="agent-panel" />,
}));
vi.mock('@/[fsd]/features/chat/ui/chat-input/SkillChatPanel.jsx', () => ({
  default: () => <span data-testid="skill-panel" />,
}));
vi.mock('@/[fsd]/widgets/llm-model-selector', () => ({
  ChatModelButton: () => <span data-testid="chat-model-button" />,
}));
vi.mock('@/[fsd]/widgets/context-budget', () => ({
  ContextBudgetUI: { ContextBudgetInfo: vi.fn(() => <span data-testid="context-budget-info" />) },
}));
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

const below = () => screen.getByTestId('chat-input-below');

describe('NewChatInput — who answers, under the field', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('puts the model button under the field when the model answers', () => {
    renderInput({ fromTheChat: true });

    expect(within(below()).getByTestId('chat-model-button')).toBeInTheDocument();
    expect(within(below()).queryByTestId('voice-button')).not.toBeInTheDocument();
    expect(screen.getByTestId('voice-button')).toBeInTheDocument();
  });

  it.each(['application', 'pipeline'])('puts the agent panel under the field for a %s', entity_name => {
    renderInput({ fromTheChat: true, activeParticipant: { entity_name } });

    expect(within(below()).getByTestId('agent-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('chat-model-button')).not.toBeInTheDocument();
  });

  it('puts the skill panel under the field for a skill', () => {
    renderInput({ fromTheChat: true, activeParticipant: { entity_name: 'skill' } });

    expect(within(below()).getByTestId('skill-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('chat-model-button')).not.toBeInTheDocument();
  });

  it('shows only the model button under the field of a test chat', () => {
    renderInput({ isAgentsPage: true, activeParticipant: { entity_name: 'application' } });

    expect(within(below()).getByTestId('chat-model-button')).toBeInTheDocument();
    expect(screen.queryByTestId('agent-panel')).not.toBeInTheDocument();
  });
});

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
      activeParticipant: { entity_name: 'application', entity_meta: { id: 11 }, meta: { name: 'Meta' } },
      activeParticipantDetails: { id: 11, name: 'Jira Helper' },
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

describe('NewChatInput context ring', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  const ringProps = {
    fromTheChat: true,
    conversationId: 101,
    showContextBudget: true,
    contextStrategy: { context_window_mode: 'full' },
    setActiveConversation: vi.fn(),
    conversationInstructions: 'Be brief',
    persona: 'generic',
  };

  it('puts the ring in the field, before the mic, with the chat values for its card', () => {
    renderInput(ringProps);

    const ring = screen.getByTestId('context-budget-info');
    expect(within(below()).queryByTestId('context-budget-info')).not.toBeInTheDocument();
    expect(ring.compareDocumentPosition(screen.getByTestId('voice-button'))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(ContextBudgetUI.ContextBudgetInfo.mock.calls[0][0]).toEqual({
      conversationId: 101,
      contextStrategy: ringProps.contextStrategy,
      setActiveConversation: ringProps.setActiveConversation,
      conversationInstructions: 'Be brief',
      persona: 'generic',
    });
  });

  it.each([
    ['a new chat', { conversationId: undefined }],
    ['a chat that is not saved', { showContextBudget: false }],
    ['a test chat', { fromTheChat: false, isAgentsPage: true }],
  ])('has no ring in %s', (_, props) => {
    renderInput({ ...ringProps, ...props });

    expect(screen.queryByTestId('context-budget-info')).not.toBeInTheDocument();
  });
});
