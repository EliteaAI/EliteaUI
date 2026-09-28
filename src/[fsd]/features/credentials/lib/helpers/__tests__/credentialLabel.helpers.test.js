import { describe, expect, it } from 'vitest';

import { resolveCredentialLabel } from '../credentialLabel.helpers';

const PERSONAL_PROJECT_ID = 5;
const TEAM_PROJECT_ID = 9;

const configuration = over => ({
  elitea_title: 'aasd',
  label: 'AA',
  project_id: TEAM_PROJECT_ID,
  shared: false,
  ...over,
});

describe('resolveCredentialLabel', () => {
  it('shows the display name of the credential the schedule references, not its ID', () => {
    const label = resolveCredentialLabel({
      configurations: [configuration()],
      credential: { elitea_title: 'aasd', private: false },
      personalProjectId: PERSONAL_PROJECT_ID,
    });

    expect(label).toBe('AA');
  });

  it('picks the private credential over a project one sharing its ID', () => {
    const label = resolveCredentialLabel({
      configurations: [
        configuration({ label: 'Project AA' }),
        configuration({ label: 'My AA', project_id: PERSONAL_PROJECT_ID }),
      ],
      credential: { elitea_title: 'aasd', private: true },
      personalProjectId: PERSONAL_PROJECT_ID,
    });

    expect(label).toBe('My AA');
  });

  it('falls back to a shared credential with the same ID, as the dropdown does', () => {
    const label = resolveCredentialLabel({
      configurations: [configuration({ label: 'Shared AA', project_id: 1, shared: true })],
      credential: { elitea_title: 'aasd', private: true },
      personalProjectId: PERSONAL_PROJECT_ID,
    });

    expect(label).toBe('Shared AA');
  });

  it('matches a credential whose ID lives only in its data title', () => {
    const label = resolveCredentialLabel({
      configurations: [configuration({ elitea_title: undefined, data: { title: 'aasd' } })],
      credential: { elitea_title: 'aasd', private: false },
      personalProjectId: PERSONAL_PROJECT_ID,
    });

    expect(label).toBe('AA');
  });

  it.each([
    ['the credential is not in the list', [configuration({ elitea_title: 'other' })]],
    ['the list has not loaded', undefined],
    ['the credential has no display name', [configuration({ label: '' })]],
  ])('shows the ID when %s', (_case, configurations) => {
    const label = resolveCredentialLabel({
      configurations,
      credential: { elitea_title: 'aasd', private: false },
      personalProjectId: PERSONAL_PROJECT_ID,
    });

    expect(label).toBe('aasd');
  });

  it('shows nothing when the schedule has no credential', () => {
    expect(resolveCredentialLabel({ configurations: [configuration()], credential: undefined })).toBeNull();
  });
});
