// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { cleanup, render, screen } from '@testing-library/react';

import AnswerApprovals from '../AnswerApprovals';

// The card itself is ErrorTrace (tested on its own): here only what the answer hands it matters
vi.mock('@/[fsd]/features/chat/ui', () => ({
  ChatContinue: () => null,
  ChatHitlActions: () => null,
  ContinuationError: () => null,
  InputGuardrailNotice: () => null,
  ErrorTrace: ({ headline, refusal, trace }) => (
    <div
      data-testid="error-trace"
      data-headline={headline ?? ''}
      data-refusal={JSON.stringify(refusal ?? null)}
      data-trace={trace}
    />
  ),
}));
vi.mock('@/[fsd]/features/chat/ui/sub-agent-section', () => ({ SubAgentAccordion: () => null }));

// What the worker sends for a credential refused at release (live agent_exception content and the stored meta.error)
const REFUSAL = {
  code: 'DENIED_ASSERTION_UNAVAILABLE',
  error: 'Your Microsoft sign-in is not available to this run. Sign in with Microsoft again, then retry.',
  ref: '0b6c2f0e-6f8a-4d7e-9a51-3c2a1e7d9b40',
};

const renderAnswer = props =>
  render(
    <AnswerApprovals
      authorizationBuckets={{ coordinator: [], subAgents: [] }}
      hitlBuckets={{ coordinator: [], subAgents: [] }}
      visibleHitlInterrupts={[]}
      renderAuthorizationCard={() => null}
      {...props}
    />,
  );

describe('AnswerApprovals refusal card', () => {
  afterEach(() => cleanup());

  it('shows a governed refusal by its code, text and reference, not by the answer text stored beside it', () => {
    renderAnswer({ exception: JSON.stringify(REFUSAL), realAnswer: REFUSAL.error });

    const card = screen.getByTestId('error-trace');
    expect(card.dataset.headline).toBe('');
    expect(JSON.parse(card.dataset.refusal)).toEqual({
      message: REFUSAL.error,
      code: REFUSAL.code,
      supportRef: REFUSAL.ref,
    });
  });

  it('keeps the answer text as the headline of any other failure', () => {
    renderAnswer({ exception: 'Traceback (most recent call last): boom', realAnswer: 'Something failed' });

    const card = screen.getByTestId('error-trace');
    expect(card.dataset.headline).toBe('Something failed');
    expect(JSON.parse(card.dataset.refusal)).toBeNull();
  });
});
