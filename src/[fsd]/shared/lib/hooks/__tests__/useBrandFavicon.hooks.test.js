// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { cleanup, renderHook } from '@testing-library/react';

import { useBrandFavicon } from '../useBrandFavicon.hooks.js';

const { customTheme } = vi.hoisted(() => ({ customTheme: { customLogo: null } }));

vi.mock('@/[fsd]/shared/lib/hooks/useCustomTheme.hooks', () => ({
  useCustomTheme: () => customTheme,
}));

const ORIGINAL_FAVICON = '/favicon.svg';
const LOGO_URL = 'https://cdn.example.com/logo.png';

// Captures every preloaded image so a test can resolve it as loaded or failed.
const probes = [];

class MockImage {
  constructor() {
    this.onload = null;
    this.onerror = null;
    this.src = '';
    probes.push(this);
  }
}

const getActiveIcon = () => document.querySelector("link[rel='icon']");

describe('useBrandFavicon', () => {
  beforeEach(() => {
    probes.length = 0;
    customTheme.customLogo = null;
    vi.stubGlobal('Image', MockImage);

    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = ORIGINAL_FAVICON;
    document.head.appendChild(link);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    document.head.innerHTML = '';
  });

  it('keeps the original favicon when there is no custom logo', () => {
    renderHook(() => useBrandFavicon());

    expect(probes).toHaveLength(0);
    expect(getActiveIcon().getAttribute('href')).toBe(ORIGINAL_FAVICON);
  });

  it('swaps to the custom logo once it loads', () => {
    customTheme.customLogo = LOGO_URL;
    renderHook(() => useBrandFavicon());

    // Not swapped until the logo is confirmed to load
    expect(getActiveIcon().getAttribute('href')).toBe(ORIGINAL_FAVICON);

    probes[0].onload();

    expect(document.querySelectorAll("link[rel='icon']")).toHaveLength(1);
    expect(getActiveIcon().id).toBe('custom-favicon');
    expect(getActiveIcon().href).toBe(LOGO_URL);
  });

  it('falls back to the original favicon when the custom logo fails to load', () => {
    customTheme.customLogo = LOGO_URL;
    renderHook(() => useBrandFavicon());

    probes[0].onerror();

    expect(document.querySelectorAll("link[rel='icon']")).toHaveLength(1);
    expect(getActiveIcon().getAttribute('href')).toBe(ORIGINAL_FAVICON);
    expect(document.getElementById('custom-favicon')).toBeNull();
  });

  it('restores the original favicon on unmount', () => {
    customTheme.customLogo = LOGO_URL;
    const { unmount } = renderHook(() => useBrandFavicon());
    probes[0].onload();

    unmount();

    expect(getActiveIcon().getAttribute('href')).toBe(ORIGINAL_FAVICON);
    expect(document.getElementById('custom-favicon')).toBeNull();
  });

  it('ignores a logo that finishes loading after unmount', () => {
    customTheme.customLogo = LOGO_URL;
    const { unmount } = renderHook(() => useBrandFavicon());
    const [probe] = probes;
    const lateOnload = probe.onload;

    unmount();
    lateOnload();

    expect(getActiveIcon().getAttribute('href')).toBe(ORIGINAL_FAVICON);
    expect(document.getElementById('custom-favicon')).toBeNull();
  });
});
