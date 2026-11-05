import { describe, expect, it, vi } from 'vitest';

import { applySendFailures } from '@/[fsd]/features/chat/lib/helpers/sendFailures.helpers';
import { ROLES } from '@/common/constants';

vi.mock('@/common/utils', () => ({ convertJsonToString: value => (value ? String(value) : '') }));

const question = { id: 'q1', role: ROLES.User, participant_id: 5, created_at: 100 };

describe('applySendFailures', () => {
  it('returns the history unchanged when there is nothing to apply', () => {
    const history = [question];
    expect(applySendFailures(history, {})).toEqual({ chatHistory: history, appliedQuestionIds: [] });
  });

  it('puts the error on the stored reply and stops it spinning', () => {
    const reply = { id: 'r1', role: ROLES.Assistant, question_id: 'q1', isStreaming: true, isLoading: true };
    const { chatHistory, appliedQuestionIds } = applySendFailures([question, reply], {
      q1: { questionId: 'q1', error: 'The service is busy processing other requests.' },
    });

    expect(appliedQuestionIds).toEqual(['q1']);
    expect(chatHistory[1]).toEqual(
      expect.objectContaining({
        id: 'r1',
        exception: 'The service is busy processing other requests.',
        isStreaming: false,
        isLoading: false,
      }),
    );
  });

  it('matches a reply through replyTo as well', () => {
    const reply = { id: 'r1', role: ROLES.Assistant, replyTo: { uuid: 'q1' }, isStreaming: true };
    const { chatHistory } = applySendFailures([question, reply], { q1: { questionId: 'q1', error: 'x' } });
    expect(chatHistory[1].exception).toBe('x');
  });

  it('adds an errored reply right after a stored question that has none', () => {
    const later = { id: 'q2', role: ROLES.User };
    const { chatHistory } = applySendFailures([question, later], {
      q1: { questionId: 'q1', error: 'Budget' },
    });

    expect(chatHistory.map(m => m.id)).toEqual(['q1', 'q1-send-failure', 'q2']);
    expect(chatHistory[1]).toEqual(
      expect.objectContaining({ role: ROLES.Assistant, question_id: 'q1', exception: 'Budget' }),
    );
  });

  it('restores a message the server never stored, with its error', () => {
    const userMessage = { id: 'q9', role: ROLES.User, created_at: 200 };
    const { chatHistory, appliedQuestionIds } = applySendFailures([question], {
      q9: { questionId: 'q9', error: 'Upload failed', userMessage },
    });

    expect(appliedQuestionIds).toEqual(['q9']);
    expect(chatHistory.map(m => m.id)).toEqual(['q1', 'q9', 'q9-send-failure']);
    expect(chatHistory[2].exception).toBe('Upload failed');
  });

  it('skips a failure it has nothing to show with', () => {
    const { chatHistory, appliedQuestionIds } = applySendFailures([question], {
      q9: { questionId: 'q9', error: 'x' },
    });
    expect(chatHistory).toEqual([question]);
    expect(appliedQuestionIds).toEqual([]);
  });

  it('falls back to a generic text for an empty error', () => {
    const { chatHistory } = applySendFailures([question], { q1: { questionId: 'q1', error: '' } });
    expect(chatHistory[1].exception).toBe('Failed to send the message.');
  });
});
