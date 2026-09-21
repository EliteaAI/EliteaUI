import { describe, expect, it } from 'vitest';

import { AutoRoutingConstants } from '@/[fsd]/shared/lib/constants';

import {
  autoModel,
  defaultModelForSurface,
  defaultModelRequest,
  modelsWithAuto,
  resolveModelSurface,
  selectionFields,
} from '../autoRouting.utils';
import { generateLLMSettings } from '../llmSettings.utils';

const { AUTO_DEFAULT_VALUE } = AutoRoutingConstants;

const profile = { id: 'v7-quality-cost', revision: 1 };
const fixed = { name: 'chosen', project_id: 7, supports_reasoning: true };

describe('Auto model picker and explicit selection', () => {
  it('project Auto default applies only to new chat and ordinary-agent settings', () => {
    const data = {
      items: [{ ...fixed, default: true }],
      auto_routing: { enabled: true },
      default_selection: autoModel(profile).selection,
    };
    for (const surface of ['chat', 'agent']) {
      const model = defaultModelForSurface(data, surface);
      const settings = generateLLMSettings(model, {}, { includeModelInfo: true });
      expect(settings.selection.mode).toBe('auto');
      expect(settings.model_name).toBeNull();
    }
    for (const surface of ['pipeline', 'pipeline_llm_node', 'llm_high_tier', 'llm_low_tier']) {
      expect(defaultModelForSurface(data, surface).name).toBe('chosen');
    }
    expect(defaultModelForSurface({ ...data, auto_routing: { enabled: false } }, 'chat').name).toBe('chosen');
    expect(defaultModelForSurface({ ...data, default_selection: null }, 'agent').name).toBe('chosen');
  });

  it('persists an Auto intent without a fake model and can switch back to concrete', () => {
    expect(defaultModelRequest('llm', AUTO_DEFAULT_VALUE)).toEqual({ section: 'llm', mode: 'auto' });
    expect(defaultModelRequest('llm', 'chosen<<>>7')).toEqual({
      section: 'llm',
      name: 'chosen',
      target_project_id: 7,
    });
    expect(defaultModelRequest('llm_high_tier', 'chosen<<>>7')).toEqual({
      section: 'llm_high_tier',
      name: 'chosen',
      target_project_id: 7,
    });
  });

  it('adds exactly one Auto only on eligible enabled surfaces', () => {
    const enabled = { enabled: true, profile_ref: profile };
    for (const surface of ['chat', 'agent']) {
      expect(modelsWithAuto([fixed], enabled, surface).map(m => m.display_name || m.name)).toEqual([
        'Auto',
        'chosen',
      ]);
    }
    expect(modelsWithAuto([fixed], enabled, 'pipeline')).toEqual([fixed]);
    expect(modelsWithAuto([fixed], { ...enabled, enabled: false }, 'chat')).toEqual([fixed]);
  });

  it('never sends the UI sentinel as a model identity', () => {
    const selected = selectionFields(autoModel(profile));
    expect(selected.model_name).toBeNull();
    expect(selected.selection.profile_ref).toEqual(profile);
    expect(generateLLMSettings(autoModel(profile), selected).model_name).toBeNull();
  });

  it('preserves an explicit Auto reasoning preset during payload construction', () => {
    const model = autoModel(profile);
    const settings = {
      ...selectionFields(model),
      selection: { ...model.selection, reasoning: { mode: 'explicit', preset: 'high' } },
    };
    expect(generateLLMSettings(model, settings).selection.reasoning).toEqual({
      mode: 'explicit',
      preset: 'high',
    });
  });

  it('explicit model replaces Auto and preserves explicit effort', () => {
    const old = { ...selectionFields(autoModel(profile)), reasoning_effort: 'high' };
    expect(selectionFields(fixed).selection).toBeNull();
    const result = generateLLMSettings(fixed, old, { includeModelInfo: true });
    expect(result.model_name).toBe('chosen');
    expect(result.reasoning_effort).toBe('high');
    expect(result.selection).toBeUndefined();
  });
});

describe('Auto output allowance and surface boundaries', () => {
  it.each([-1, 8000, 32000, 64000])(
    'preserves the requested allowance %s without inventing a model limit',
    max_tokens => {
      const model = autoModel(profile);
      expect(model).not.toHaveProperty('max_output_tokens');
      expect(generateLLMSettings(model, { max_tokens }).max_tokens).toBe(max_tokens);
    },
  );

  it.each([
    ['pipeline', 'agent', 'pipeline'],
    [undefined, 'pipeline', 'pipeline'],
    ['agent', 'pipeline', 'chat'],
    [undefined, undefined, 'chat'],
  ])('resolves the active surface before offering Auto', (primary, fallback, expected) => {
    expect(resolveModelSurface(primary, fallback)).toBe(expected);
  });
});
