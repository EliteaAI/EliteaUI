import { describe, expect, it } from 'vitest';

import { resolveModelChipLabel } from '../modelChip.helpers';

const toListedModel = (projectId, name, displayName) => ({
  id: `${projectId}_${name}`,
  project_id: projectId,
  name,
  display_name: displayName,
});

const sharedBedrockSonnet = toListedModel(1, 'global.anthropic.claude-sonnet-5', 'Anthropic Sonnet 5');
const dialSonnet = toListedModel(2, 'anthropic.claude-sonnet-5', 'Dial-Anthropic-Sonnet-5');
const sharedLuna = toListedModel(1, 'global.openai.gpt-5.6-luna', 'Golubaya Luna');
const privateLuna = toListedModel(2, 'global.openai.gpt-5.6-luna', 'GPT-5.6 Luna (global)');
const models = [sharedBedrockSonnet, sharedLuna, dialSonnet, privateLuna];

describe('resolveModelChipLabel', () => {
  it('labels the response with the selected model when another project lists the same model name', () => {
    expect(resolveModelChipLabel('2_global.openai.gpt-5.6-luna', models, sharedLuna)).toBe('Golubaya Luna');
    expect(resolveModelChipLabel('global.openai.gpt-5.6-luna', models, privateLuna)).toBe(
      'GPT-5.6 Luna (global)',
    );
  });

  it('labels a model whose name is a substring of an earlier listed model with its own display name', () => {
    expect(resolveModelChipLabel('2_anthropic.claude-sonnet-5', models, null)).toBe(
      'Dial-Anthropic-Sonnet-5',
    );
  });

  it('ignores the selected model when the response came from a different model', () => {
    expect(resolveModelChipLabel('2_anthropic.claude-sonnet-5', models, sharedLuna)).toBe(
      'Dial-Anthropic-Sonnet-5',
    );
  });

  it('falls back to a partial match when no listed model name is equal', () => {
    expect(resolveModelChipLabel('claude-sonnet-5', [sharedBedrockSonnet])).toBe('Anthropic Sonnet 5');
  });

  it('returns the raw model name when no listed model matches', () => {
    expect(resolveModelChipLabel('2_gpt-5.4', models)).toBe('2_gpt-5.4');
  });

  it('returns an empty label for a missing model name', () => {
    expect(resolveModelChipLabel(undefined, models)).toBe('');
  });
});
