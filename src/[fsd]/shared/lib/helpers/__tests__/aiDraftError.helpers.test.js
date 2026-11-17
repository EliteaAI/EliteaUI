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

  it('finds the Ray ID through the markup Cloudflare wraps it in', () => {
    const cases = [
      '<li>Ray ID: a59e932038b3d975</li>',
      '<li>Ray ID: <strong>a59e932038b3d975</strong></li>',
      '<li>Ray ID:&nbsp;a59e932038b3d975</li>',
      '<span class="cf-footer-item">Ray ID:&nbsp;<strong>a59e932038b3d975</strong></span>',
    ];
    cases.forEach(data => {
      expect(getAiDraftErrorMessage({ status: 'PARSING_ERROR', originalStatus: 504, data })).toContain(
        'a59e932038b3d975',
      );
    });
  });

  it('keeps the status alone when the page carries no Ray ID', () => {
    const error = { status: 'PARSING_ERROR', originalStatus: 504, data: '<html>gateway time-out</html>' };
    expect(getAiDraftErrorMessage(error)).toMatch(/\(HTTP 504\)$/);
  });

  it('falls back to the status when a JSON 5xx carries an empty message', () => {
    expect(getAiDraftErrorMessage({ status: 500, data: { error: '' } })).toBe('Request failed. (HTTP 500)');
    expect(getAiDraftErrorMessage({ status: 500, data: { detail: '' } })).toBe('Request failed. (HTTP 500)');
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
