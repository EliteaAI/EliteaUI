import { describe, expect, it } from 'vitest';

import { getActiveBanner } from '../bannerConfig.helpers';

const banner = (id, overrides = {}) => ({
  id,
  message: `Banner ${id}`,
  dismissible: true,
  persist_dismissal: true,
  updated_at: 'v1',
  ...overrides,
});

describe('getActiveBanner', () => {
  it('returns the first banner of the queue', () => {
    expect(getActiveBanner([banner(1), banner(2)], {}, new Set())?.id).toBe(1);
  });

  it('returns null for an empty queue', () => {
    expect(getActiveBanner([], {}, new Set())).toBeNull();
  });

  it('reveals the next banner after the current one is closed in this session', () => {
    expect(getActiveBanner([banner(1), banner(2)], {}, new Set(['1:v1']))?.id).toBe(2);
  });

  it('shows a banner closed in this session again after it was changed', () => {
    expect(getActiveBanner([banner(1, { updated_at: 'v2' })], {}, new Set(['1:v1']))?.id).toBe(1);
  });

  it('skips a banner closed in a previous visit when persistence is on', () => {
    expect(getActiveBanner([banner(1), banner(2)], { 1: 'v1' }, new Set())?.id).toBe(2);
  });

  it('ignores the stored close when persistence is off', () => {
    const banners = [banner(1, { persist_dismissal: false }), banner(2)];
    expect(getActiveBanner(banners, { 1: 'v1' }, new Set())?.id).toBe(1);
  });

  it('shows a banner again after it was changed', () => {
    expect(getActiveBanner([banner(1, { updated_at: 'v2' })], { 1: 'v1' }, new Set())?.id).toBe(1);
  });

  it('keeps a non-dismissible banner at the head of the queue', () => {
    const banners = [banner(1, { dismissible: false }), banner(2)];
    expect(getActiveBanner(banners, {}, new Set())?.id).toBe(1);
  });
});
