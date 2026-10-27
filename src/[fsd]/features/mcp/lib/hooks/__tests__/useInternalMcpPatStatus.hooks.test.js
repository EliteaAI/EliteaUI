// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { renderHook } from '@testing-library/react';

import { useInternalMcpPatStatus } from '../useInternalMcpPatStatus.hooks';

const mocks = vi.hoisted(() => ({ data: undefined }));

vi.mock('@/api/toolkits.js', () => ({
  useInternalMcpPatStatusQuery: () => ({ data: mocks.data, isLoading: false, refetch: vi.fn() }),
}));

const run = data => {
  mocks.data = data;
  return renderHook(() => useInternalMcpPatStatus({ projectId: 1, toolkitType: 'mcp_elitea' })).result
    .current;
};

describe('useInternalMcpPatStatus', () => {
  it('treats GOVERNED as no PAT problem and says so (#7214)', () => {
    expect(run({ internal: true, state: 'GOVERNED' })).toMatchObject({
      patInvalid: false,
      patState: null,
      governed: true,
    });
  });

  it('still gates on a missing or expired PAT when governance is off', () => {
    expect(run({ internal: true, state: 'MISSING' })).toMatchObject({
      patInvalid: true,
      patState: 'MISSING',
      governed: false,
    });
    expect(run({ internal: true, state: 'EXPIRED' })).toMatchObject({
      patInvalid: true,
      patState: 'EXPIRED',
    });
    expect(run({ internal: true, state: 'VALID' })).toMatchObject({ patInvalid: false, governed: false });
    expect(run({ internal: false, state: 'VALID' })).toMatchObject({ patInvalid: false, governed: false });
  });
});
