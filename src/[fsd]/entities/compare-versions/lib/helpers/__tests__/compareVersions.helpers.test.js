import { describe, expect, it, vi } from 'vitest';

import {
  buildPipelineRunSettingsRows,
  buildRunSettingsRows,
  extractPipelineCompareData,
  extractSkillCompareData,
  getChangedRowKeys,
  matchDependencies,
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

describe('extractPipelineCompareData', () => {
  const detail = {
    instructions: 'nodes: []\n',
    welcome_message: 'Hi',
    conversation_starters: ['Go'],
    meta: { step_limit: 40, ignore_project_context: true },
    pipeline_settings: { nodes: [], trigger: { type: 'schedule', cron: '0 9 * * *', timezone: 'UTC' } },
    tools: [
      { type: 'github', id: 11, name: 'GitHub' },
      { type: 'application', agent_type: 'pipeline', id: 5, settings: { application_id: 22 }, name: 'Sub' },
      // A linked agent whose version is gone: the version API sends no agent_type for it
      { type: 'application', id: 7, settings: { application_id: 30 }, name: 'Deleted agent' },
      { type: 'application', id: 6, settings: {}, name: 'Gone agent' },
    ],
  };

  it('takes the YAML, user interaction, run settings and legacy trigger of the version', () => {
    expect(extractPipelineCompareData(detail)).toMatchObject({
      instructions: 'nodes: []\n',
      welcome_message: 'Hi',
      conversation_starters: ['Go'],
      run_settings: { step_limit: 40, ignore_project_context: true },
      legacy_trigger: { cron: '0 9 * * *', timezone: 'UTC' },
    });
  });

  it('matches tools by type and id and marks the ones that are gone', () => {
    const tools = extractPipelineCompareData(detail).tools;
    expect(tools.map(tool => [tool.entityType, tool.id, tool.isAvailable])).toEqual([
      ['toolkit', 11, true],
      ['pipeline', 22, true],
      ['agent', 30, false],
      ['agent', 6, false],
    ]);
    expect(matchDependencies(tools, tools.slice(0, 1)).map(row => Boolean(row.right))).toEqual([
      true,
      false,
      false,
      false,
    ]);
  });

  it('has no legacy trigger without a cron and defaults the run settings', () => {
    expect(
      extractPipelineCompareData({ pipeline_settings: { trigger: { type: 'chat_message' } } }),
    ).toMatchObject({
      instructions: '',
      tools: [],
      run_settings: { step_limit: null, ignore_project_context: false },
      legacy_trigger: null,
    });
  });
});

describe('buildPipelineRunSettingsRows', () => {
  it('shows the step limit and project context, and flags the rows that differ', () => {
    const left = buildPipelineRunSettingsRows({ step_limit: null, ignore_project_context: false });
    const right = buildPipelineRunSettingsRows({ step_limit: 40, ignore_project_context: false });
    expect(valuesOf(left)).toEqual({ step_limit: 'Default', project_context: 'Included' });
    expect(valuesOf(right)).toEqual({ step_limit: '40', project_context: 'Included' });
    expect([...getChangedRowKeys(left, right)]).toEqual(['step_limit']);
  });
});
