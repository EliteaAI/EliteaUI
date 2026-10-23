import { describe, expect, it } from 'vitest';

import { readRefusal } from '../refusal.utils';

const REFUSAL = {
  success: false,
  code: 'CREDENTIAL_REFERENCE_REQUIRED',
  message: 'This credential is registered for governed use; save it and test the saved credential.',
};

describe('readRefusal', () => {
  it('reads the message and code of a 403 that carries both', () => {
    expect(readRefusal({ status: 403, data: REFUSAL })).toEqual({
      message: REFUSAL.message,
      code: REFUSAL.code,
    });
  });

  it.each([
    ['no code', { status: 403, data: { success: false, message: 'Denied' } }],
    ['blank code', { status: 403, data: { code: '  ', message: 'Denied' } }],
    ['non-string code', { status: 403, data: { code: 42, message: 'Denied' } }],
    ['no message', { status: 403, data: { code: 'X' } }],
    ['blank message', { status: 403, data: { code: 'X', message: ' ' } }],
    ['array body', { status: 403, data: [{ code: 'X', message: 'Denied' }] }],
    ['string body', { status: 403, data: 'Forbidden' }],
    ['no body', { status: 403 }],
    ['other status', { status: 400, data: REFUSAL }],
    ['no error', undefined],
  ])('returns undefined for %s', (_name, error) => {
    expect(readRefusal(error)).toBeUndefined();
  });
});
