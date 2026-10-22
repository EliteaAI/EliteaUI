import { describe, expect, it } from 'vitest';

import { parseRefusalPayload } from '../refusal.helpers';

describe('parseRefusalPayload', () => {
  it('returns undefined for undefined input', () => {
    expect(parseRefusalPayload(undefined)).toBeUndefined();
  });

  it('returns undefined for an empty string', () => {
    expect(parseRefusalPayload('')).toBeUndefined();
  });

  it('returns undefined for a plain text stack trace', () => {
    expect(parseRefusalPayload('Traceback (most recent call last):\n  File "app.py"')).toBeUndefined();
  });

  it('returns undefined for JSON that lacks an error field', () => {
    expect(parseRefusalPayload('{"code": "SOME_CODE"}')).toBeUndefined();
  });

  it('parses a full refusal payload with code and error', () => {
    const result = parseRefusalPayload('{"code": "INPUT_GUARDRAIL", "error": "Request blocked by policy."}');
    expect(result).toEqual({ code: 'INPUT_GUARDRAIL', message: 'Request blocked by policy.' });
  });

  it('parses a refusal payload that has only error (no code)', () => {
    const result = parseRefusalPayload('{"error": "Blocked."}');
    expect(result).toEqual({ code: undefined, message: 'Blocked.' });
  });

  it('returns undefined for malformed JSON', () => {
    expect(parseRefusalPayload('{bad json}')).toBeUndefined();
  });

  it('returns undefined for a JSON array', () => {
    expect(parseRefusalPayload('["not", "an", "object"]')).toBeUndefined();
  });

  it('returns undefined for a JSON null', () => {
    expect(parseRefusalPayload('null')).toBeUndefined();
  });
});
