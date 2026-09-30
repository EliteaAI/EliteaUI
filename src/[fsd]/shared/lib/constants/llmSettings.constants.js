export const REASONING_EFFORT_VALUES = {
  Low: 'low',
  Medium: 'medium',
  High: 'high',
};

export const REASONING_EFFORT_OFF = 'none';

export const THINKING_TYPES = {
  adaptive: 'adaptive',
  enabled: 'enabled',
  alwaysOn: 'always_on',
};

export const REASONING_EFFORT_ORDER = ['none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'];

export const FALLBACK_REASONING_EFFORTS = [
  REASONING_EFFORT_VALUES.Low,
  REASONING_EFFORT_VALUES.Medium,
  REASONING_EFFORT_VALUES.High,
];

export const REASONING_EFFORT_LABELS = {
  none: 'Off',
  minimal: 'Minimal',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  xhigh: 'Extra high',
  max: 'Max',
};

export const REASONING_EFFORT_TOOLTIPS = {
  none: 'Reasoning off. Fastest and cheapest; the model may skip tool calls.',
  minimal: 'Barely any reasoning — quick answers for simple tasks.',
  low: 'Fast, surface-level reasoning — concise answers with minimal steps.',
  medium: 'Balanced reasoning — clear explanations with moderate multi-step thinking.',
  high: 'Deep, thorough reasoning — detailed step-by-step analysis (may be slower).',
  xhigh: 'Very deep reasoning — for hard problems; slower and costlier.',
  max: 'No limit on reasoning — the slowest and most expensive level.',
};

export const REASONING_HELPER_TEXTS = {
  alwaysOn: 'This model always thinks. Effort sets how much.',
  off: 'Reasoning is off. The model may skip tool calls.',
  budget: 'Levels set a thinking token budget for this model.',
  unsupportedStored: level =>
    `The saved level "${level}" isn't offered for this model. It stays in effect until you pick another level.`,
  replaceWithLevel: label => `Use ${label}`,
  fixedLevel: label => `This model accepts only ${label}.`,
};

export const DEFAULT_MAX_TOKENS = -1;
export const DEFAULT_MAX_TOKENS_CUSTOM = 4096;
export const DEFAULT_TEMPERATURE = 0.6;
export const DEFAULT_REASONING_EFFORT = REASONING_EFFORT_VALUES.Medium;
export const REASONING_MIN_TOKENS = 4096;
export const DEFAULT_STEPS_LIMIT = 25;
