import { describe, expect, it } from 'vitest';

import {
  includesProjectContext,
  isSkillChatModelPending,
  isSkillVersionLocked,
  resolveSkillChatLLMSettings,
  resolveSkillChatModel,
  testPanelSettingsFor,
  toRunSettingsPayload,
  withRunSettings,
} from '@/[fsd]/features/skill/lib/helpers/skillRunSettings.helpers';

describe('toRunSettingsPayload', () => {
  it('keeps never-configured run settings as null', () => {
    expect(toRunSettingsPayload(null)).toBeNull();
    expect(toRunSettingsPayload(undefined)).toBeNull();
  });

  it('drops unset LLM fields left behind by a model switch', () => {
    expect(
      toRunSettingsPayload({
        llm_settings: {
          model_name: 'gpt-4.1',
          model_project_id: 2,
          selection: null,
          temperature: 0.3,
          reasoning_effort: null,
          max_tokens: 4096,
        },
        ignore_project_context: true,
      }),
    ).toEqual({
      llm_settings: { model_name: 'gpt-4.1', model_project_id: 2, temperature: 0.3, max_tokens: 4096 },
      ignore_project_context: true,
    });
  });

  it('sends a cleared model as no llm_settings at all', () => {
    expect(toRunSettingsPayload({ llm_settings: null, ignore_project_context: false })).toEqual({
      ignore_project_context: false,
    });
  });

  it('keeps an Auto selection without a concrete model', () => {
    const selection = { mode: 'auto', profile_ref: { id: 'p', revision: 1 } };
    expect(toRunSettingsPayload({ llm_settings: { selection, model_name: null } })).toEqual({
      llm_settings: { selection },
      ignore_project_context: false,
    });
  });
});

describe('includesProjectContext', () => {
  it('defaults to on', () => {
    expect(includesProjectContext(null)).toBe(true);
    expect(includesProjectContext({})).toBe(true);
    expect(includesProjectContext({ ignore_project_context: true })).toBe(false);
  });
});

describe('isSkillVersionLocked', () => {
  it.each([
    ['published', true],
    ['embedded', true],
    ['draft', false],
    [null, false],
  ])('%s -> %s', (status, locked) => {
    expect(isSkillVersionLocked(status)).toBe(locked);
  });
});

describe('testPanelSettingsFor', () => {
  const reasoningSaved = { reasoning_effort: 'medium', max_tokens: 900 };

  it('drops a saved effort when the panel runs a non-reasoning model', () => {
    expect(
      testPanelSettingsFor({ ...reasoningSaved, temperature: 0.2 }, { supports_reasoning: false }),
    ).toEqual({
      max_tokens: 900,
      temperature: 0.2,
      reasoning_effort: null,
    });
  });

  it('drops a saved temperature when the panel runs a reasoning model', () => {
    expect(
      testPanelSettingsFor({ temperature: 0.2, reasoning_effort: 'high' }, { supports_reasoning: true }),
    ).toMatchObject({ temperature: null, reasoning_effort: 'high' });
  });

  it('starts a reasoning model on its default effort when none was saved', () => {
    expect(
      testPanelSettingsFor(
        { temperature: 0.2 },
        { supports_reasoning: true, default_effort: 'low', supported_efforts: ['low', 'high'] },
      ),
    ).toMatchObject({ temperature: null, reasoning_effort: 'low' });
  });
});

describe('skill chat model precedence', () => {
  const runSettingsVersion = { run_settings: { llm_settings: { model_name: 'claude', temperature: 0.2 } } };
  const models = [
    { name: 'gpt-4.1', project_id: 2, default: true },
    { name: 'claude', project_id: 2 },
    { name: 'gemini', project_id: 1 },
  ];

  it("prefers the chat's own model over the version's run settings", () => {
    const entitySettings = { version_id: 7, llm_settings: { model_name: 'gemini', model_project_id: 1 } };
    const llmSettings = resolveSkillChatLLMSettings(entitySettings, runSettingsVersion);
    expect(llmSettings).toBe(entitySettings.llm_settings);
    expect(resolveSkillChatModel(models, llmSettings)).toBe(models[2]);
  });

  it('falls back to the run settings, then to the project default model', () => {
    expect(
      resolveSkillChatModel(models, resolveSkillChatLLMSettings({ version_id: 7 }, runSettingsVersion)),
    ).toBe(models[1]);
    expect(resolveSkillChatModel(models, resolveSkillChatLLMSettings({ llm_settings: {} }, undefined))).toBe(
      models[0],
    );
  });
});

describe('isSkillChatModelPending', () => {
  it("waits for the pinned version's run settings when the chat has no model of its own", () => {
    expect(isSkillChatModelPending({ version_id: 7 }, undefined)).toBe(true);
    expect(isSkillChatModelPending({ version_id: 7, llm_settings: { temperature: 0.2 } }, undefined)).toBe(
      true,
    );
  });

  it('is settled once the pinned version is known or the chat picked a model', () => {
    expect(isSkillChatModelPending({ version_id: 7 }, { id: 7, run_settings: null })).toBe(false);
    expect(
      isSkillChatModelPending({ version_id: 7, llm_settings: { model_name: 'gpt-4.1' } }, undefined),
    ).toBe(false);
  });
});

describe('withRunSettings', () => {
  const versionUpdate = { id: 7, instructions: 'x', tags: [] };

  it.each([null, undefined])('leaves run_settings out when the form has none (%s)', runSettings => {
    expect(withRunSettings(versionUpdate, runSettings)).toEqual(versionUpdate);
    expect('run_settings' in withRunSettings(versionUpdate, runSettings)).toBe(false);
  });

  it('sends configured run settings', () => {
    expect(withRunSettings(versionUpdate, { llm_settings: null, ignore_project_context: true })).toEqual({
      ...versionUpdate,
      run_settings: { ignore_project_context: true },
    });
  });
});
