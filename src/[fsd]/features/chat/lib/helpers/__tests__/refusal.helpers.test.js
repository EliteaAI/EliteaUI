import { describe, expect, it } from 'vitest';

import { parseRefusalPayload } from '../refusal.helpers';

const DENIED = { code: 'DENIED_GRANT', error: 'This agent is not allowed to use one of its credentials for you.' };

describe('parseRefusalPayload', () => {
  it('reads the text and code from a stringified payload', () => {
    expect(parseRefusalPayload(JSON.stringify(DENIED, null, 2))).toEqual({
      message: DENIED.error,
      code: 'DENIED_GRANT',
    });
  });

  it('accepts an already parsed object', () => {
    expect(parseRefusalPayload(DENIED)).toEqual({ message: DENIED.error, code: 'DENIED_GRANT' });
  });

  it('returns the text alone when there is no code', () => {
    expect(parseRefusalPayload('{"error": "Denied"}')).toEqual({ message: 'Denied' });
    expect(parseRefusalPayload({ code: 42, error: 'Denied' })).toEqual({ message: 'Denied' });
  });

  it.each([
    ['no error field', '{"code": "DENIED_GRANT"}'],
    ['empty error', '{"code": "X", "error": "  "}'],
    ['non-string error', '{"code": "X", "error": {"detail": "nested"}}'],
    ['array payload', '[{"msg": "bad"}]'],
    ['plain text', 'Traceback (most recent call last): boom'],
    ['malformed json', '{"error": "cut'],
    ['oversized payload', `{"error": "${'a'.repeat(5000)}"}`],
    ['empty', ''],
    ['null', null],
    ['undefined', undefined],
  ])('keeps the generic rendering for %s', (_name, input) => {
    expect(parseRefusalPayload(input)).toBeUndefined();
  });
});
