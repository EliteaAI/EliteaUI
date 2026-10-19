import { describe, expect, it } from 'vitest';

import { hasCredentialConfigChanged, revertCredentialFields } from '../credentialWarning.helpers';

const toolkit = credential => ({ settings: { github_configuration: credential } });

const legacy = { elitea_title: 'aasd', private: false };
const pinnedA = { ...legacy, configuration_uuid: 'uuid-a', configuration_project_id: 9 };
const pinnedB = { ...legacy, configuration_uuid: 'uuid-b', configuration_project_id: 9 };

describe('hasCredentialConfigChanged', () => {
  it('detects a change of the configuration uuid alone', () => {
    expect(hasCredentialConfigChanged(toolkit(pinnedB), toolkit(pinnedA))).toBe(true);
  });

  it('detects a pinned original replaced by a legacy value of the same title', () => {
    expect(hasCredentialConfigChanged(toolkit(legacy), toolkit(pinnedA))).toBe(true);
  });

  it('does not flag re-picking the same pinned row', () => {
    expect(hasCredentialConfigChanged(toolkit(pinnedA), toolkit(pinnedA))).toBe(false);
  });

  it('does not flag upgrading a legacy original to a pinned value of the same title', () => {
    expect(hasCredentialConfigChanged(toolkit(pinnedA), toolkit(legacy))).toBe(false);
  });

  it('still detects a title or private change', () => {
    expect(hasCredentialConfigChanged(toolkit({ ...legacy, private: true }), toolkit(legacy))).toBe(true);
    expect(hasCredentialConfigChanged(toolkit({ ...legacy, elitea_title: 'other' }), toolkit(legacy))).toBe(
      true,
    );
  });
});

describe('revertCredentialFields', () => {
  it('restores the original credential, including its uuid, after a uuid-only change', () => {
    const reverted = revertCredentialFields(toolkit(pinnedB), toolkit(pinnedA));

    expect(reverted.settings.github_configuration).toEqual(pinnedA);
  });
});
