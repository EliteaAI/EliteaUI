import { describe, expect, it } from 'vitest';

import { AI_DRAFT_ERROR_FALLBACK, getAiDraftErrorMessage } from '../aiDraftError.helpers.js';

describe('getAiDraftErrorMessage', () => {
  it('prefers the backend envelope when the body survived', () => {
    expect(
      getAiDraftErrorMessage({ status: 504, data: { error: 'LLM generation timed out after 60s.' } }),
    ).toBe('LLM generation timed out after 60s.');
    expect(
      getAiDraftErrorMessage({ status: 404, data: { detail: 'Application or version not found' } }),
    ).toBe('Application or version not found');
  });

  it('joins pydantic validation errors', () => {
    const error = { status: 400, data: [{ msg: 'field required' }, { msg: 'too long' }] };
    expect(getAiDraftErrorMessage(error)).toBe('field required; too long');
  });

  it('reads the real code from originalStatus when a proxy replaced the body with HTML', () => {
    const error = {
      status: 'PARSING_ERROR',
      originalStatus: 504,
      data: '<html>gateway time-out<br>Ray ID: a59e932038b3d975</html>',
    };
    const message = getAiDraftErrorMessage(error);
    expect(message).toContain('shorten the description');
    expect(message).toContain('HTTP 504');
    expect(message).toContain('a59e932038b3d975');
  });

  it('names the status for other proxy errors', () => {
    expect(getAiDraftErrorMessage({ status: 'PARSING_ERROR', originalStatus: 503, data: '<html/>' })).toBe(
      'The service is temporarily unavailable. (HTTP 503)',
    );
    expect(getAiDraftErrorMessage({ status: 'PARSING_ERROR', originalStatus: 418, data: '<html/>' })).toBe(
      'Request failed. (HTTP 418)',
    );
  });

  it('reports a lost connection and keeps the caller fallback otherwise', () => {
    expect(getAiDraftErrorMessage({ status: 'FETCH_ERROR', error: 'TypeError' })).toContain('No connection');
    expect(getAiDraftErrorMessage({ status: 'CUSTOM_ERROR' }, 'Failed to generate dimension.')).toBe(
      'Failed to generate dimension.',
    );
    expect(getAiDraftErrorMessage({ status: 'CUSTOM_ERROR' })).toBe(AI_DRAFT_ERROR_FALLBACK);
    expect(getAiDraftErrorMessage(null)).toBeNull();
  });
});
