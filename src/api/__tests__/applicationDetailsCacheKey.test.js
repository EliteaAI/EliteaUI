// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { store } from '@/[fsd]/shared/config';
import { eliteaApi } from '@/api/eliteaApi';

import '../applications';

const select = args => eliteaApi.endpoints.applicationDetails.select(args)(store.getState());

describe('applicationDetails cache key', () => {
  it('stores numeric and string ids of one application in the same entry', async () => {
    await store.dispatch(
      eliteaApi.util.upsertQueryData(
        'applicationDetails',
        { projectId: 406, applicationId: 545 },
        { id: 545 },
      ),
    );

    expect(select({ projectId: '406', applicationId: '545' }).data).toEqual({ id: 545 });
  });

  it('updates the entry for both id forms', async () => {
    await store.dispatch(
      eliteaApi.util.upsertQueryData(
        'applicationDetails',
        { projectId: 406, applicationId: '997' },
        { name: 'B' },
      ),
    );
    store.dispatch(
      eliteaApi.util.updateQueryData('applicationDetails', { projectId: 406, applicationId: 997 }, () => ({
        name: 'B saved',
      })),
    );

    expect(select({ projectId: 406, applicationId: '997' }).data).toEqual({ name: 'B saved' });
  });

  it('keeps different applications apart', () => {
    expect(select({ projectId: 406, applicationId: 1 }).data).toBeUndefined();
  });
});
