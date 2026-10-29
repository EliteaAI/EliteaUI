import { describe, expect, it } from 'vitest';

import { parseRefusalPayload, parseValidationRefusal } from '../refusal.helpers';

const DENIED = {
  code: 'DENIED_GRANT',
  error: 'This agent is not allowed to use one of its credentials for you.',
};

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

  it('keeps the support reference of a worker refusal', () => {
    const payload = { ...DENIED, ref: '0b6c2f0e-6f8a-4d7e-9a51-3c2a1e7d9b40' };
    expect(parseRefusalPayload(JSON.stringify(payload))).toEqual({
      message: DENIED.error,
      code: 'DENIED_GRANT',
      supportRef: payload.ref,
    });
  });

  it.each([
    ['markup', '<img src=x>'],
    ['a path', '../../etc'],
    ['too long', 'a'.repeat(65)],
    ['not a string', 42],
  ])('drops a support reference that is %s', (_name, ref) => {
    expect(parseRefusalPayload({ ...DENIED, ref })).toEqual({ message: DENIED.error, code: 'DENIED_GRANT' });
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

describe('parseValidationRefusal (#7281)', () => {
  const TEXT =
    'Your Microsoft sign-in is not available to this run. Sign in with Microsoft again, then retry.';

  it('reads a toolkit connection error that names its code', () => {
    expect(
      parseValidationRefusal({ type: 'connection_error', msg: TEXT, code: 'DENIED_ASSERTION_UNAVAILABLE' }),
    ).toEqual({
      message: TEXT,
      code: 'DENIED_ASSERTION_UNAVAILABLE',
    });
  });

  it("reads an agent's toolkit error whose text is the refusal payload", () => {
    const msg = `Value error, ${JSON.stringify({ code: 'DENIED_ASSERTION_UNAVAILABLE', error: TEXT })}`;
    expect(parseValidationRefusal(msg)).toEqual({ message: TEXT, code: 'DENIED_ASSERTION_UNAVAILABLE' });
  });

  it.each([
    ['a connection error without a code', { type: 'connection_error', msg: 'Authentication failed' }],
    ['a settings error', { type: 'missing', msg: 'Field required', loc: ['url'] }],
    ['a plain misconfiguration text', 'Application misconfiguration error for agent_name=x: boom'],
    ['a refusal payload without a code', 'Value error, {"error": "Denied"}'],
    ['nothing', undefined],
  ])('keeps the misconfiguration marker for %s', (_name, input) => {
    expect(parseValidationRefusal(input)).toBeUndefined();
  });
});
