// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ProjectIdStorageKey, ProjectNameStorageKey } from '@/common/constants';

import { applyProjectFromUrl } from '../projectContext.helpers';

// Newer Node versions define their own (unusable) web storage globals, so provide plain in-memory ones
const createStorage = () => {
  const data = new Map();
  return {
    getItem: key => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: key => data.delete(key),
    clear: () => data.clear(),
  };
};

describe('applyProjectFromUrl', () => {
  beforeEach(() => {
    vi.stubGlobal('sessionStorage', createStorage());
    vi.stubGlobal('localStorage', createStorage());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    window.history.replaceState({}, '', '/');
  });

  it('applies the project to this tab only and cleans the address bar', () => {
    localStorage.setItem(ProjectIdStorageKey, '1');
    window.history.replaceState({}, '', '/agents/all/7?viewMode=owner&project_id=9#top');

    expect(applyProjectFromUrl()).toBe(true);

    expect(sessionStorage.getItem(ProjectIdStorageKey)).toBe('9');
    expect(localStorage.getItem(ProjectIdStorageKey)).toBe('1');
    expect(window.location.pathname + window.location.search + window.location.hash).toBe(
      '/agents/all/7?viewMode=owner#top',
    );
  });

  it('forgets a stale project name so it is refilled from the project list', () => {
    sessionStorage.setItem(ProjectIdStorageKey, '2');
    sessionStorage.setItem(ProjectNameStorageKey, 'Old');
    window.history.replaceState({}, '', '/chat?project_id=9');

    applyProjectFromUrl();

    expect(sessionStorage.getItem(ProjectNameStorageKey)).toBeNull();
  });

  it('does nothing without the parameter', () => {
    window.history.replaceState({}, '', '/chat?x=1');
    expect(applyProjectFromUrl()).toBe(false);
    expect(sessionStorage.getItem(ProjectIdStorageKey)).toBeNull();
  });

  it.each(['abc', '0', '-3', '1.5', ''])('ignores an invalid id (%s) but still cleans the URL', value => {
    window.history.replaceState({}, '', `/chat?project_id=${value}`);
    expect(applyProjectFromUrl()).toBe(false);
    expect(sessionStorage.getItem(ProjectIdStorageKey)).toBeNull();
    expect(window.location.search).toBe('');
  });
});
