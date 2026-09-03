import { describe, expect, it } from 'vitest';

import {
  filterCredentialTagsByAllowedTypes,
  filterCredentialsByAllowedTypes,
  getAllowedCredentialTypes,
} from '../credentialVisibility.helpers';

describe('credential visibility', () => {
  it('derives allowed types from the project-scoped catalogue', () => {
    const allowed = getAllowedCredentialTypes([{ type: 'github' }, { type: 'jira' }, null, {}]);

    expect([...allowed].sort()).toEqual(['github', 'jira']);
  });

  it('hides credentials of a type the catalogue omitted for this project', () => {
    const allowed = getAllowedCredentialTypes([{ type: 'github' }]);

    const visible = filterCredentialsByAllowedTypes(
      [
        { id: 1, type: 'github' },
        { id: 2, type: 'langfuse' },
      ],
      allowed,
    );

    expect(visible.map(credential => credential.id)).toEqual([1]);
  });

  it('hides the matching type filter chip as well', () => {
    const allowed = getAllowedCredentialTypes([{ type: 'github' }]);

    const tags = filterCredentialTagsByAllowedTypes(
      [
        { id: 'a', data: { type: 'github' } },
        { id: 'b', data: { type: 'langfuse' } },
      ],
      allowed,
    );

    expect(tags.map(tag => tag.id)).toEqual(['a']);
  });

  it('shows everything while the catalogue is still loading', () => {
    const credentials = [{ id: 1, type: 'langfuse' }];

    expect(filterCredentialsByAllowedTypes(credentials, getAllowedCredentialTypes([]))).toEqual(credentials);
  });
});
