import { describe, expect, it } from 'vitest';

import { compareModels, getDefaultModelDescription, getModelProviderRank } from '../llmModel.helpers';

// ---------------------------------------------------------------------------
// getDefaultModelDescription — table-driven
// ---------------------------------------------------------------------------

describe('getDefaultModelDescription — Claude family', () => {
  it.each([
    // 3.x rules match on the exact prefix, NOT on a trailing date digit
    ['claude-3-opus-20240229', 'Most powerful for complex tasks'],
    ['claude-3-5-sonnet-20241022', 'Balanced for speed and intelligence'],
    ['claude-3-7-sonnet-20250219', 'Extended thinking for complex tasks'],
    ['claude-3-5-haiku-20241022', 'Fastest model for near-instant tasks'],
    ['claude-3-haiku-20240307', 'Fastest for instant responses'],
    ['claude-3-sonnet-20240229', 'Balanced for diverse tasks'],

    // 4.x rules: version digit anchored — date suffix must NOT bleed into version match
    ['claude-opus-4-1-20250805', 'Most capable for complex work'], // was falsely matching opus-5 before fix
    ['eu.anthropic.claude-opus-4-20250514', 'Most capable for complex work'],
    ['claude-sonnet-4-20250514', 'Smart and fast for everyday tasks'],
    ['eu.anthropic.claude-sonnet-4-5-20250929-v1:0', 'Balanced for speed and intelligence'],
    ['anthropic.claude-haiku-4-5-20250929-v1:0', 'Fastest Claude for quick, simple tasks'],
    ['claude-haiku-4-1-20250805', 'Fastest for quick, simple tasks'], // haiku-4, NOT haiku-4-5

    // 5.x rules
    ['anthropic.claude-sonnet-5', 'Smart and fast for most tasks'],
    ['eu.anthropic.claude-sonnet-5-5-20251001', 'Smart and fast for most tasks'],
    ['claude-opus-5-5-20251001', 'Most capable for ambitious work'],
    ['claude-opus-5-20250915', 'Most capable for ambitious work'],

    // Catch-alls (display_name style names)
    [null, null], // no name → null
  ])('name=%s → %s', (name, expected) => {
    const model = name ? { name, display_name: '' } : { name: '', display_name: '' };
    expect(getDefaultModelDescription(model)).toBe(expected);
  });

  it('falls back to display_name when name has no match', () => {
    const model = { name: 'some-unknown-id', display_name: 'Claude Opus 5' };
    // display_name matches the catch-all /claude.*opus/ pattern
    expect(getDefaultModelDescription(model)).toBe('Most capable for ambitious work');
  });

  it('backend description wins — helper is called externally, not tested here', () => {
    // The helper itself does not check model.description; it is the caller's responsibility
    // to prefer model.description. We verify the helper never returns model.description.
    const model = { name: 'gpt-5.6-luna', display_name: '', description: 'Custom override' };
    expect(getDefaultModelDescription(model)).toBe('Fast and low-cost for simple tasks');
  });
});

describe('getDefaultModelDescription — OpenAI family', () => {
  it.each([
    ['global.openai.gpt-5.6-luna', 'Fast and low-cost for simple tasks'],
    ['global.openai.gpt-5.6-sol', 'Deep reasoning for complex problems'],
    ['global.openai.gpt-5.6-terra', 'Balanced for everyday tasks'],
    ['gpt-5.4-2026-03-05', 'Previous-gen all-rounder'],
    ['gpt-4o-mini', 'Affordable and fast for light tasks'],
    ['gpt-4o', 'Fast, flexible for diverse tasks'],
    ['gpt-4-turbo', 'Improved instruction following'],
    ['gpt-3.5-turbo', 'Fast, inexpensive model for simple tasks'],
  ])('name=%s → %s', (name, expected) => {
    expect(getDefaultModelDescription({ name, display_name: '' })).toBe(expected);
  });

  it('gpt-5.6 names do NOT match the GPT-6 rule', () => {
    // "6" in "5.6" is preceded by ".", not a separator like "-" or " "
    expect(getDefaultModelDescription({ name: 'gpt-5.6-terra', display_name: '' })).not.toBe(
      'Most capable for hard, long tasks',
    );
  });
});

// ---------------------------------------------------------------------------
// getModelProviderRank
// ---------------------------------------------------------------------------

describe('getModelProviderRank', () => {
  it.each([
    ['global.openai.gpt-5.6-luna', 0],
    ['gpt-5.4-2026-03-05', 0],
    ['eu.anthropic.claude-sonnet-4-5-20250929-v1:0', 1],
    ['anthropic.claude-sonnet-5', 1],
    ['claude-3-5-sonnet-20241022', 1],
    ['azure-phi-4', 2],
    ['custom-internal-model', 3],
  ])('name=%s → rank %i', (name, rank) => {
    expect(getModelProviderRank({ name })).toBe(rank);
  });

  it('returns rank 3 for empty name', () => {
    expect(getModelProviderRank({ name: '' })).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// compareModels
// ---------------------------------------------------------------------------

describe('compareModels', () => {
  it('places OpenAI (rank 0) before Anthropic (rank 1)', () => {
    const gpt = { name: 'gpt-5.6-luna' };
    const claude = { name: 'eu.anthropic.claude-sonnet-4-5-20250929-v1:0' };
    expect(compareModels(gpt, claude)).toBeLessThan(0);
  });

  it('places Anthropic (rank 1) before Others (rank 3)', () => {
    const claude = { name: 'anthropic.claude-sonnet-5' };
    const custom = { name: 'custom-model' };
    expect(compareModels(claude, custom)).toBeLessThan(0);
  });

  it('within same provider, sorts alphabetically by name', () => {
    const a = { name: 'gpt-4o' };
    const b = { name: 'gpt-5.6-luna' };
    expect(compareModels(a, b)).toBeLessThan(0);
    expect(compareModels(b, a)).toBeGreaterThan(0);
  });

  it('returns 0 for identical names', () => {
    const a = { name: 'gpt-4o' };
    const b = { name: 'gpt-4o' };
    expect(compareModels(a, b)).toBe(0);
  });

  it('sorts a mixed list into provider order then alphabetical', () => {
    const models = [
      { name: 'custom-model' },
      { name: 'eu.anthropic.claude-sonnet-5' },
      { name: 'global.openai.gpt-5.6-sol' },
      { name: 'global.openai.gpt-5.6-luna' },
      { name: 'another-custom' },
    ];
    const sorted = [...models].sort(compareModels).map(m => m.name);
    expect(sorted).toEqual([
      'global.openai.gpt-5.6-luna',
      'global.openai.gpt-5.6-sol',
      'eu.anthropic.claude-sonnet-5',
      'another-custom',
      'custom-model',
    ]);
  });
});
