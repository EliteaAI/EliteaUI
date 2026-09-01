import { describe, expect, it } from 'vitest';

import { buildPalette } from './buildPalette';
import { darkColorScheme } from './colorScheme.dark';
import { lightColorScheme } from './colorScheme.light';
import { darkEffectScheme } from './effectScheme.dark';
import { lightEffectScheme } from './effectScheme.light';
import { darkNodeColors } from './nodeColors.dark';
import { lightNodeColors } from './nodeColors.light';
import { darkPalette, lightPalette } from './palettes';

const keyPaths = (obj, prefix = '') =>
  Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return value && typeof value === 'object' && !Array.isArray(value) ? keyPaths(value, path) : [path];
  });

describe('palette parity', () => {
  it('dark and light expose the same key paths', () => {
    expect(keyPaths(darkPalette).sort()).toEqual(keyPaths(lightPalette).sort());
  });

  it('dark and light color schemes expose the same keys', () => {
    expect(Object.keys(darkColorScheme).sort()).toEqual(Object.keys(lightColorScheme).sort());
  });

  it('dark and light effect schemes expose the same keys', () => {
    expect(Object.keys(darkEffectScheme).sort()).toEqual(Object.keys(lightEffectScheme).sort());
  });

  it('dark and light node colors expose the same keys', () => {
    expect(Object.keys(darkNodeColors).sort()).toEqual(Object.keys(lightNodeColors).sort());
  });

  it('accepts custom theme JSON without applying overrides yet', () => {
    const customTheme = JSON.parse('{"colors":{"accent":"#123456"}}');

    expect(buildPalette(darkColorScheme, darkEffectScheme, darkNodeColors, customTheme)).toEqual(darkPalette);
  });
});
