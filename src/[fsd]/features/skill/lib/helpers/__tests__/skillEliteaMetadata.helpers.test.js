import { describe, expect, it } from 'vitest';

import {
  applyEliteaMetadataEdits,
  composeEditorFrontmatter,
  encodeEliteaMetadata,
  splitEditorFrontmatter,
} from '../skillEliteaMetadata.helpers';

const AUTO_SELECTION = {
  mode: 'auto',
  profile_ref: { id: 'balanced', revision: 1 },
  scope_mode: 'run_locked',
  reasoning: { mode: 'auto' },
};
const GPT = { name: 'gpt-4.1', project_id: 2 };
const O3 = { name: 'o3', project_id: 2, supports_reasoning: true };
const TAGS = [{ id: 4, name: 'python' }, { name: 'a, b' }];
const RUN_SETTINGS = {
  llm_settings: { model_name: 'gpt-4.1', model_project_id: 2, temperature: 0.2, max_tokens: 4000 },
  ignore_project_context: true,
};

describe('encodeEliteaMetadata', () => {
  it('writes the same strings, in the same order, as the server export', () => {
    const metadata = encodeEliteaMetadata({ tags: TAGS, versionName: 'v2', runSettings: RUN_SETTINGS });

    expect(Object.entries(metadata)).toEqual([
      ['elitea-tags', '["python", "a, b"]'],
      ['elitea-version', 'v2'],
      ['elitea-model', 'gpt-4.1'],
      ['elitea-temperature', '0.2'],
      ['elitea-max-tokens', '4000'],
      ['elitea-ignore-project-context', 'true'],
    ]);
  });

  it('writes Auto selection as server-style JSON and no model name', () => {
    const metadata = encodeEliteaMetadata({
      runSettings: { llm_settings: { selection: AUTO_SELECTION, model_name: null, max_tokens: 4096 } },
    });

    expect(metadata).toEqual({
      'elitea-max-tokens': '4096',
      'elitea-model-selection':
        '{"mode": "auto", "profile_ref": {"id": "balanced", "revision": 1}, "scope_mode": "run_locked", "reasoning": {"mode": "auto"}}',
    });
  });

  it('writes nothing for a base version without tags or run settings', () => {
    expect(encodeEliteaMetadata({ tags: [], versionName: 'base', runSettings: null })).toEqual({});
  });

  it('leaves out a fixed selection and a false project-context flag', () => {
    const runSettings = {
      llm_settings: { model_name: 'gpt-4.1', selection: { mode: 'fixed', model_ref: GPT } },
      ignore_project_context: false,
    };

    expect(encodeEliteaMetadata({ runSettings })).toEqual({ 'elitea-model': 'gpt-4.1' });
  });
});

describe('composeEditorFrontmatter', () => {
  it('orders keys like the export and merges ELITEA keys into metadata', () => {
    const frontmatter = {
      'argument-hint': '[v]',
      metadata: { author: 'me', 'elitea-tags': '["stale"]' },
      'allowed-tools': 'Read',
      license: 'MIT',
      tags: ['owned'],
    };

    const composed = composeEditorFrontmatter(frontmatter, { 'elitea-tags': '["fresh"]' });

    expect(Object.keys(composed)).toEqual(['license', 'allowed-tools', 'metadata', 'argument-hint']);
    expect(composed.metadata).toEqual({ author: 'me', 'elitea-tags': '["fresh"]' });
  });

  it('drops a stale ELITEA key the form no longer has', () => {
    expect(composeEditorFrontmatter({ metadata: { author: 'me', 'elitea-model': 'old' } }, {})).toEqual({
      metadata: { author: 'me' },
    });
  });

  it('writes no metadata when there is nothing to put in it', () => {
    expect(composeEditorFrontmatter({ license: 'MIT' }, {})).toEqual({ license: 'MIT' });
  });
});

describe('splitEditorFrontmatter', () => {
  it('separates the ELITEA keys from the keys that are stored as typed', () => {
    expect(
      splitEditorFrontmatter({
        license: 'MIT',
        metadata: { author: 'me', 'elitea-tags': '["a"]', 'elitea-temperature': 0.3 },
      }),
    ).toEqual({
      frontmatter: { license: 'MIT', metadata: { author: 'me' } },
      eliteaMetadata: { 'elitea-tags': '["a"]', 'elitea-temperature': 0.3 },
    });
  });

  it('drops a metadata block that held only ELITEA keys', () => {
    expect(splitEditorFrontmatter({ metadata: { 'elitea-tags': '["a"]' } }).frontmatter).toEqual({});
  });

  it('keeps a metadata value that is not a mapping so the server can reject it', () => {
    expect(splitEditorFrontmatter({ metadata: 'author' }).frontmatter).toEqual({ metadata: 'author' });
  });
});

const edit = (textMetadata, { tags = TAGS, runSettings = RUN_SETTINGS, models = [GPT, O3] } = {}) =>
  applyEliteaMetadataEdits({
    textMetadata,
    formMetadata: encodeEliteaMetadata({ tags, versionName: 'v2', runSettings }),
    tags,
    runSettings,
    models,
  });

const withoutKey = (record, key) =>
  Object.fromEntries(Object.entries(record).filter(([name]) => name !== key));

const UNCHANGED = encodeEliteaMetadata({ tags: TAGS, versionName: 'v2', runSettings: RUN_SETTINGS });

describe('applyEliteaMetadataEdits', () => {
  it('changes nothing when the text matches the form', () => {
    expect(edit(UNCHANGED)).toEqual({ errors: [] });
  });

  it('changes nothing when the tags are typed as a YAML list with the same names', () => {
    expect(edit({ ...UNCHANGED, 'elitea-tags': ['python', 'a, b'] })).toEqual({ errors: [] });
  });

  it.each([
    ['a JSON string', '["python", "rust"]'],
    ['a YAML list', ['python', 'rust']],
  ])('reads tags written as %s and keeps the saved tag objects', (_case, value) => {
    expect(edit({ ...UNCHANGED, 'elitea-tags': value }).tags).toEqual([
      { id: 4, name: 'python' },
      { name: 'rust' },
    ]);
  });

  it('clears the tags when the line is deleted', () => {
    const rest = withoutKey(UNCHANGED, 'elitea-tags');

    expect(edit(rest).tags).toEqual([]);
  });

  it('reads a temperature typed as a string or a YAML number', () => {
    expect(edit({ ...UNCHANGED, 'elitea-temperature': '0.5' }).runSettings.llm_settings.temperature).toBe(
      0.5,
    );
    expect(edit({ ...UNCHANGED, 'elitea-temperature': 0.7 }).runSettings.llm_settings.temperature).toBe(0.7);
  });

  it('accepts -1, the default max tokens', () => {
    expect(edit({ ...UNCHANGED, 'elitea-max-tokens': '-1' }).runSettings.llm_settings.max_tokens).toBe(-1);
  });

  it.each(['0', '-5'])('rejects %s max tokens', value => {
    expect(edit({ ...UNCHANGED, 'elitea-max-tokens': value }).errors).toHaveLength(1);
  });

  it('switches the model the way the model picker does', () => {
    const { runSettings } = edit({ ...UNCHANGED, 'elitea-model': 'o3' });

    expect(runSettings.llm_settings).toMatchObject({
      model_name: 'o3',
      model_project_id: 2,
      max_tokens: 4000,
      selection: null,
      temperature: null,
      reasoning_effort: 'medium',
    });
  });

  it('finds a model by name when the saved project differs', () => {
    const runSettings = { llm_settings: { model_name: 'gpt-4.1', model_project_id: 9 } };

    expect(
      edit({ ...UNCHANGED, 'elitea-model': 'o3' }, { runSettings }).runSettings.llm_settings,
    ).toMatchObject({
      model_name: 'o3',
      model_project_id: 2,
    });
  });

  it('switches to Auto routing from a pasted selection', () => {
    const { runSettings } = edit({
      ...UNCHANGED,
      'elitea-model-selection': JSON.stringify(AUTO_SELECTION),
    });

    expect(runSettings.llm_settings).toMatchObject({
      selection: AUTO_SELECTION,
      model_name: null,
      max_tokens: 4000,
    });
  });

  it('reads the project-context flag', () => {
    const rest = withoutKey(UNCHANGED, 'elitea-ignore-project-context');

    expect(edit(rest).runSettings.ignore_project_context).toBe(false);
  });

  it('ignores an edited version line', () => {
    expect(edit({ ...UNCHANGED, 'elitea-version': 'renamed' })).toEqual({ errors: [] });
  });

  it.each([
    ['elitea-tags', '[python', '"metadata.elitea-tags" must be a JSON array of tag names'],
    ['elitea-tags', '[1, 2]', '"metadata.elitea-tags" must be a JSON array of tag names'],
    ['elitea-temperature', 'hot', '"metadata.elitea-temperature" must be a number'],
    [
      'elitea-max-tokens',
      '12.5',
      '"metadata.elitea-max-tokens" must be a positive integer or -1 for the default',
    ],
    ['elitea-model', 'gpt-9', '"metadata.elitea-model" names an unknown model: gpt-9'],
    [
      'elitea-model-selection',
      '{"mode": "fixed"}',
      '"metadata.elitea-model-selection" must be a JSON object for Auto model selection',
    ],
    [
      'elitea-ignore-project-context',
      'maybe',
      '"metadata.elitea-ignore-project-context" must be true or false',
    ],
  ])('reports an invalid %s and keeps the form value', (key, value, message) => {
    const result = edit({ ...UNCHANGED, [key]: value });

    expect(result.errors).toEqual([message]);
    expect(result).not.toHaveProperty('tags');
    expect(result).not.toHaveProperty('runSettings');
  });

  it('refuses a temperature next to an active reasoning effort, as the server does', () => {
    const runSettings = {
      llm_settings: { model_name: 'o3', model_project_id: 2, reasoning_effort: 'medium' },
    };

    const result = edit(
      { 'elitea-model': 'o3', 'elitea-reasoning-effort': 'medium', 'elitea-temperature': '0.4' },
      {
        tags: [],
        runSettings,
      },
    );

    expect(result.errors).toEqual([
      '"metadata.elitea-temperature" cannot be combined with an active "metadata.elitea-reasoning-effort"',
    ]);
    expect(result.runSettings.llm_settings).toMatchObject({ temperature: null, reasoning_effort: 'medium' });
  });

  it('accepts a temperature when the reasoning effort is none', () => {
    const runSettings = { llm_settings: { model_name: 'o3', model_project_id: 2, reasoning_effort: 'none' } };

    const result = edit(
      { 'elitea-model': 'o3', 'elitea-reasoning-effort': 'none', 'elitea-temperature': '0.4' },
      {
        tags: [],
        runSettings,
      },
    );

    expect(result.errors).toEqual([]);
    expect(result.runSettings.llm_settings).toMatchObject({ temperature: 0.4, reasoning_effort: 'none' });
  });

  it('applies the valid lines when another line is invalid', () => {
    const result = edit({ ...UNCHANGED, 'elitea-temperature': 'hot', 'elitea-max-tokens': '2000' });

    expect(result.errors).toEqual(['"metadata.elitea-temperature" must be a number']);
    expect(result.runSettings.llm_settings).toMatchObject({ temperature: 0.2, max_tokens: 2000 });
  });
});
