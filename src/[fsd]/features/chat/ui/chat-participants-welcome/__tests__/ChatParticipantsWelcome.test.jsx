// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import { getParticipantWelcomeKey } from '@/[fsd]/features/chat/participants/lib/helpers/participants.helpers';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import ChatParticipantsWelcome from '../ChatParticipantsWelcome';

// The hook resolves the active participant's greeting; here every agent greets with its own id.
vi.mock('@/[fsd]/features/chat/participants/lib/hooks', async () => {
  const helpers = await import('@/[fsd]/features/chat/participants/lib/helpers/participants.helpers');
  return {
    useParticipantsWelcomeMessages: participants => ({
      entries: participants.map(participant => ({
        key: helpers.getParticipantWelcomeKey(participant),
        participant,
        message: `Hello from ${participant.entity_meta.id} v${participant.entity_settings.version_id}`,
      })),
      isLoading: false,
    }),
  };
});

vi.mock('../ChatParticipantWelcomeItem', () => ({
  default: ({ message }) => <div data-testid="chat-participant-welcome-item">{message}</div>,
}));

vi.mock('@/components/Icons/ArrowDownIcon', () => ({ default: () => null }));

const theme = createTheme({
  palette: {
    icon: { default: '#000' },
    border: { lines: '#000' },
    background: { default: { primary: '#fff' } },
  },
});

const agent = (id, versionId = 1) => ({
  id: `p${id}`,
  entity_name: 'application',
  entity_meta: { id, project_id: 1 },
  entity_settings: { version_id: versionId },
});

const A = agent(1);
const B = agent(2);

const ui = props => (
  <ThemeProvider theme={theme}>
    <ChatParticipantsWelcome
      conversationId={1}
      {...props}
    />
  </ThemeProvider>
);

const isExpanded = () =>
  screen.getByTestId('chat-participants-welcome-toggle').getAttribute('aria-expanded') === 'true';

describe('ChatParticipantsWelcome', () => {
  beforeEach(() => vi.clearAllMocks());

  afterEach(() => cleanup());

  it('renders nothing without an active agent', () => {
    render(ui({ participants: [A], activeParticipant: undefined, userMessageCount: 0 }));
    expect(screen.queryByTestId('chat-participants-welcome')).not.toBeInTheDocument();
  });

  it('shows only the active agent and is expanded in an empty chat', () => {
    render(ui({ participants: [A, B], activeParticipant: B, userMessageCount: 0 }));
    expect(isExpanded()).toBe(true);
    expect(screen.getAllByTestId('chat-participant-welcome-item')).toHaveLength(1);
    expect(screen.getByText('Hello from 2 v1')).toBeInTheDocument();
  });

  it('is collapsed when opening a chat that already has user messages', () => {
    render(ui({ participants: [A], activeParticipant: A, userMessageCount: 3 }));
    expect(isExpanded()).toBe(false);
  });

  it('collapses after the first user message and toggles on click', () => {
    const { rerender } = render(ui({ participants: [A], activeParticipant: A, userMessageCount: 0 }));
    rerender(ui({ participants: [A], activeParticipant: A, userMessageCount: 1 }));
    expect(isExpanded()).toBe(false);

    fireEvent.click(screen.getByTestId('chat-participants-welcome-toggle'));
    expect(isExpanded()).toBe(true);
  });

  it('stays collapsed when switching to another existing agent', () => {
    const { rerender } = render(ui({ participants: [A, B], activeParticipant: A, userMessageCount: 2 }));
    rerender(ui({ participants: [A, B], activeParticipant: B, userMessageCount: 2 }));

    expect(isExpanded()).toBe(false);
    expect(screen.getByTestId('chat-participants-welcome')).toBeInTheDocument();
  });

  it('expands when a newly added agent becomes active mid-chat', () => {
    const { rerender } = render(ui({ participants: [A], activeParticipant: A, userMessageCount: 2 }));
    rerender(ui({ participants: [A, B], activeParticipant: B, userMessageCount: 2 }));

    expect(isExpanded()).toBe(true);
    expect(screen.getByText('Hello from 2 v1')).toBeInTheDocument();
  });

  it('expands when the active agent switches version mid-chat', () => {
    const { rerender } = render(ui({ participants: [A, B], activeParticipant: A, userMessageCount: 2 }));
    const switched = agent(1, 2);
    rerender(ui({ participants: [switched, B], activeParticipant: switched, userMessageCount: 2 }));

    expect(isExpanded()).toBe(true);
    expect(screen.getByText('Hello from 1 v2')).toBeInTheDocument();
  });

  it('does not expand later for a greeting added before the last user message', () => {
    const { rerender } = render(ui({ participants: [A], activeParticipant: A, userMessageCount: 2 }));
    rerender(ui({ participants: [A, B], activeParticipant: A, userMessageCount: 2 }));
    rerender(ui({ participants: [A, B], activeParticipant: A, userMessageCount: 3 }));
    rerender(ui({ participants: [A, B], activeParticipant: B, userMessageCount: 3 }));

    expect(isExpanded()).toBe(false);
  });

  it('welcome key includes the pinned version', () => {
    expect(getParticipantWelcomeKey(agent(1, 1))).not.toBe(getParticipantWelcomeKey(agent(1, 2)));
  });
});
