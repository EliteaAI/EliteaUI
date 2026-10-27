// @vitest-environment jsdom
/**
 * C-1009 (#7227): the editor chat of a two-level development run. The shapes are those of a real run on the local
 * stack (fixtures/nested-development-run-7227.json): a draft parent calling a draft child calling a bound leaf, every
 * level admitted on its own decision. A sub-agent refused by governance shows the refusal card in its own accordion,
 * an admitted one shows normally, and a turn refused before it started shows the card for the turn.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';

import fixture from './fixtures/nested-development-run-7227.json';

vi.hoisted(() => vi.stubEnv('VITE_SERVER_URL', 'http://localhost/api/v2/'));

vi.mock('@/ComponentsLib/Tooltip', () => ({ default: ({ children }) => children }));
vi.mock('@/assets/arrow-right-icon.svg?react', () => ({ default: () => null }));
vi.mock('@/components/Icons/CopyIcon', () => ({ default: () => null }));
vi.mock('@/components/Icons/DownloadIcon', () => ({ default: () => null }));
vi.mock('@/components/Chat/ActionView', () => ({
  default: ({ action }) => <span data-testid="action-chip">{action?.name}</span>,
}));

const { convertToAIAnswer } = await import('@/common/convertChatConversationMessages');
const { default: ApplicationThinkView } = await import('@/components/Chat/ApplicationThinkView');
const { default: ErrorTrace } = await import('@/[fsd]/features/chat/ui/error-trace/ErrorTrace');

const theme = createTheme({
  palette: {
    border: { error: '#f00', lines: '#333', table: '#333' },
    background: {
      error: '#fee',
      surface: { interactive: { default: '#eee', active: '#ddd' } },
      secondary: '#111',
      tabPanel: '#111',
    },
    text: {
      warning: '#900',
      primary: '#000',
      secondary: '#555',
      metrics: '#555',
      button: { disabled: '#777' },
    },
    icon: { default: '#000', fill: { default: '#000', secondary: '#555' } },
  },
});

const PARENT = 'dev-7227-draft-parent';
const CHILD = 'dev-7227-draft-child';
const LEAF = 'dev-7227-bound-leaf';
const REFUSAL = fixture.refusalFrame.content;

const answer = () =>
  convertToAIAnswer(
    {
      id: 10759,
      author_participant_id: 62,
      reply_to_id: 10758,
      uuid: 'reply-1',
      created_at: '2026-10-27T13:42:36.421415',
      meta: { error: '', is_error: false },
      message_items: [],
    },
    [{ id: 10758, uuid: 'question-1', message_items: [] }],
    [{ id: 62, entity_name: 'application', entity_meta: { id: 67, project_id: 2 }, meta: { name: PARENT } }],
    fixture.rows,
  );

const renderTree = props =>
  render(
    <ThemeProvider theme={theme}>
      <ApplicationThinkView
        defaultExpanded
        messageId="reply-1"
        {...props}
      />
    </ThemeProvider>,
  );

describe('the editor chat of a two-level development run (#7227)', () => {
  afterEach(() => cleanup());

  it('shows both admitted levels of the real run, the child and the bound leaf inside it, with no refusal', () => {
    const { toolActions } = answer();
    renderTree({ actions: toolActions, originalActions: toolActions });

    expect(screen.getAllByText(CHILD).length).toBeGreaterThan(0);
    expect(screen.getAllByText(new RegExp(LEAF)).length).toBeGreaterThan(0);
    expect(screen.queryByTestId('error-code-chip')).not.toBeInTheDocument();
  });

  it('shows the refusal card of a refused child in that child accordion and leaves its admitted sibling alone', () => {
    const { toolActions } = answer();
    renderTree({
      actions: toolActions,
      originalActions: toolActions,
      // what the chat stores for a child's own exception, keyed by the sub-agent (components/Chat/hooks.js)
      subAgentErrors: { [CHILD]: { name: CHILD, exception: JSON.stringify(REFUSAL, null, 2) } },
    });
    fireEvent.click(screen.getAllByText(CHILD)[0]);

    const chips = screen.getAllByTestId('error-code-chip');
    expect(chips).toHaveLength(1);
    expect(chips[0]).toHaveTextContent('DENIED_DEVELOPMENT_CREDENTIAL');
    expect(screen.getByText(REFUSAL.error)).toBeInTheDocument();
    // the readable text, not the raw payload, is the headline
    expect(screen.queryByText(/"code":/)).not.toBeInTheDocument();
  });

  it('keeps any other child error as its own text', () => {
    const { toolActions } = answer();
    renderTree({
      actions: toolActions,
      originalActions: toolActions,
      subAgentErrors: { [CHILD]: { name: CHILD, exception: 'Tool execution failed: timeout' } },
    });
    fireEvent.click(screen.getAllByText(CHILD)[0]);

    expect(screen.queryByTestId('error-code-chip')).not.toBeInTheDocument();
    expect(screen.getAllByText('Tool execution failed: timeout').length).toBeGreaterThan(0);
  });

  it('shows the turn refused before it started (a child decision of the draft) as one card with its code', () => {
    // components/Chat/hooks.js stores a socket_validation_error as the message exception, stringified
    render(
      <ThemeProvider theme={theme}>
        <ErrorTrace
          headline=""
          trace={JSON.stringify(REFUSAL, null, 2)}
          messageId="reply-2"
        />
      </ThemeProvider>,
    );

    const card = screen.getByText(REFUSAL.error).closest('div');
    expect(within(card).getByTestId('error-code-chip')).toHaveTextContent(REFUSAL.code);
    fireEvent.click(screen.getByText('Error debugging info'));
    expect(screen.getByText(/DENIED_DEVELOPMENT_CREDENTIAL/, { selector: 'pre' })).toBeInTheDocument();
  });
});
