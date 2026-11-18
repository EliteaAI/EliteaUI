import { describe, expect, it, vi } from 'vitest';

import { toggleSet } from '../setToggle.helpers';

describe('toggleSet', () => {
  it('adds an id that is not in the set', () => {
    const setter = vi.fn();
    toggleSet(setter)(42);
    const updater = setter.mock.calls[0][0];
    const result = updater(new Set());
    expect(result.has(42)).toBe(true);
  });

  it('removes an id that is already in the set', () => {
    const setter = vi.fn();
    toggleSet(setter)(42);
    const updater = setter.mock.calls[0][0];
    const result = updater(new Set([42]));
    expect(result.has(42)).toBe(false);
  });

  it('does not mutate the previous set', () => {
    const prev = new Set([1, 2]);
    const setter = vi.fn();
    toggleSet(setter)(3);
    const updater = setter.mock.calls[0][0];
    updater(prev);
    expect(prev.has(3)).toBe(false);
  });

  it('can toggle multiple independent ids', () => {
    const setter = vi.fn();
    toggleSet(setter)(1);
    toggleSet(setter)(2);
    const [upd1, upd2] = setter.mock.calls.map(c => c[0]);
    const s = new Set();
    const after1 = upd1(s);
    const after2 = upd2(after1);
    expect(after2.has(1)).toBe(true);
    expect(after2.has(2)).toBe(true);
  });

  it('preserves other ids in the set when toggling', () => {
    const setter = vi.fn();
    toggleSet(setter)(10);
    const updater = setter.mock.calls[0][0];
    const result = updater(new Set([5, 10, 15]));
    expect(result.has(5)).toBe(true);
    expect(result.has(10)).toBe(false);
    expect(result.has(15)).toBe(true);
  });

  it('returns a new Set instance every time', () => {
    const setter = vi.fn();
    toggleSet(setter)(1);
    const updater = setter.mock.calls[0][0];
    const prev = new Set([1]);
    const result = updater(prev);
    expect(result).not.toBe(prev);
  });
});
