import { describe, expect, it } from 'vitest';

import { mergePalette } from '../theme.helpers';

describe('mergePalette', () => {
  const basePalette = {
    mode: 'dark',
    primary: { main: '#6ae8fa' },
    background: {
      default: { primary: '#0E131D', secondary: '#181F2A' },
      tabButton: { active: '#ffffff1a' },
    },
    list: ['a', 'b'],
  };

  it('deep-merges nested tokens and keeps base keys missing from override', () => {
    const result = mergePalette(basePalette, {
      background: { default: { primary: '#120f22' } },
    });

    expect(result.background.default).toEqual({ primary: '#120f22', secondary: '#181F2A' });
    expect(result.background.tabButton).toEqual({ active: '#ffffff1a' });
    expect(result.primary).toEqual({ main: '#6ae8fa' });
  });

  it('lets override primitives and arrays win', () => {
    const result = mergePalette(basePalette, { mode: 'light', primary: { main: '#b18cff' }, list: ['c'] });

    expect(result.mode).toBe('light');
    expect(result.primary.main).toBe('#b18cff');
    expect(result.list).toEqual(['c']);
  });

  it('does not mutate inputs', () => {
    const override = { background: { default: { primary: '#120f22' } } };
    const baseSnapshot = JSON.parse(JSON.stringify(basePalette));
    const overrideSnapshot = JSON.parse(JSON.stringify(override));

    mergePalette(basePalette, override);

    expect(basePalette).toEqual(baseSnapshot);
    expect(override).toEqual(overrideSnapshot);
  });

  it('returns base palette when override is not an object', () => {
    expect(mergePalette(basePalette, null)).toBe(basePalette);
    expect(mergePalette(basePalette, undefined)).toEqual(basePalette);
  });
});
