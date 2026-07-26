import { describe, expect, it } from 'vitest';

import { shouldBlockRunIndexPanel } from './runIndex.helpers';

describe('run index loading state', () => {
  it('keeps the execution panel mounted during background refetches', () => {
    expect(
      shouldBlockRunIndexPanel({
        hasEffectiveIndex: true,
        hasToolkit: true,
        isToolkitFetching: true,
        indexesLoading: false,
        indexesFetching: true,
        hasIndexesData: true,
      }),
    ).toBe(false);
  });

  it('blocks the panel until its initial toolkit and index data are available', () => {
    expect(
      shouldBlockRunIndexPanel({
        hasEffectiveIndex: false,
        hasToolkit: false,
        isToolkitFetching: true,
        indexesLoading: true,
        indexesFetching: true,
        hasIndexesData: false,
      }),
    ).toBe(true);
  });
});
