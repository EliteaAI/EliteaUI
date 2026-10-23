import { describe, expect, it } from 'vitest';

import { getProbeConfigurationUuid } from '../credentialProbe.helpers';

describe('getProbeConfigurationUuid', () => {
  it('returns the uuid of a saved credential whose form is clean', () => {
    expect(getProbeConfigurationUuid({ uuid: 'uuid-1' }, false)).toBe('uuid-1');
  });

  it('returns nothing once the form has unsaved edits', () => {
    expect(getProbeConfigurationUuid({ uuid: 'uuid-1' }, true)).toBeUndefined();
  });

  it.each([
    ['a credential that is not saved yet', { type: 'github', settings: {} }],
    ['an empty uuid', { uuid: '' }],
    ['a non-string uuid', { uuid: 7 }],
    ['no credential', undefined],
  ])('returns nothing for %s', (_name, credentialDetails) => {
    expect(getProbeConfigurationUuid(credentialDetails, false)).toBeUndefined();
  });
});
