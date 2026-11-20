// @vitest-environment jsdom
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';

import { cleanup, renderHook } from '@testing-library/react';

import { useSectionFilterCount } from '../useSectionFilterCount.hooks';

const countAt = url =>
  renderHook(() => useSectionFilterCount(), {
    wrapper: ({ children }) => <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>,
  }).result.current;

describe('useSectionFilterCount', () => {
  afterEach(() => cleanup());

  it('is zero without filters', () => {
    expect(countAt('/agents/all?view=table')).toBe(0);
  });

  it('counts each distinct tag and the folder', () => {
    expect(countAt('/agents/all?tags[]=a&tags[]=b&tags[]=a&folder=3')).toBe(3);
  });
});
