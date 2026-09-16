import { describe, expect, it } from 'vitest';

import { autoModel, modelsWithAuto, selectionFields } from './autoRouting.utils';
import { generateLLMSettings } from './llmSettings.utils';

const profile = { id: 'v7-quality-cost', revision: 1 };
const fixed = { name: 'chosen', project_id: 7, supports_reasoning: true };

describe('Auto model picker and explicit selection', () => {
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
    const settings = { ...selectionFields(model), selection: { ...model.selection, reasoning: { mode: 'explicit', preset: 'high' } } };
    expect(generateLLMSettings(model, settings).selection.reasoning).toEqual({ mode: 'explicit', preset: 'high' });
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
