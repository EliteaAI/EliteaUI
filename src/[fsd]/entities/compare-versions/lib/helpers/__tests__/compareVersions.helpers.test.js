import { describe, expect, it, vi } from 'vitest';

import {
  buildRunSettingsRows,
  extractSkillCompareData,
} from '@/[fsd]/entities/compare-versions/lib/helpers/compareVersions.helpers';

vi.mock('@/[fsd]/entities/version', () => ({ buildVersionOption: vi.fn(), formatVersionMeta: vi.fn() }));

const valuesOf = rows => Object.fromEntries(rows.map(row => [row.key, row.value]));

describe('extractSkillCompareData', () => {
  it('carries the run settings of the version', () => {
    const runSettings = { ignore_project_context: true };
    expect(
      extractSkillCompareData({ version_details: { instructions: 'x', run_settings: runSettings } }),
    ).toEqual({ instructions: 'x', run_settings: runSettings });
  });
});

describe('buildRunSettingsRows', () => {
  it('describes a version without run settings as the project defaults', () => {
    expect(valuesOf(buildRunSettingsRows(null))).toEqual({
      model: 'Project default',
      temperature: 'Default',
      reasoning_effort: 'Default',
      max_tokens: 'Default',
      project_context: 'Included',
    });
  });

  it('describes a fixed model with its settings', () => {
    const rows = buildRunSettingsRows({
      llm_settings: { model_name: 'gpt-4.1', temperature: 0.3, max_tokens: 4096 },
      ignore_project_context: true,
    });
    expect(valuesOf(rows)).toMatchObject({
      model: 'gpt-4.1',
      temperature: '0.3',
      max_tokens: '4096',
      project_context: 'Excluded',
    });
  });

  it('names Auto rather than a model', () => {
    expect(valuesOf(buildRunSettingsRows({ llm_settings: { selection: { mode: 'auto' } } })).model).toBe(
      'Auto',
    );
  });
});
