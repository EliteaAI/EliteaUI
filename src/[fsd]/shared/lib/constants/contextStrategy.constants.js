export const SEPARATOR = '$$$';

export const CONTEXT_BUDGET = {
  HIGH_UTILIZATION_THRESHOLD: 1,
  COMPACTION_RATIO: 0.9,
};

export const CONTEXT_WINDOW_MODES = {
  BALANCED: 'balanced',
  FULL: 'full',
};

export const BALANCED_WINDOW_TOKENS = 272000;

export const CONTEXT_WINDOW_COPY = {
  LABEL: 'Context window',
  BALANCED_DESCRIPTION: "Up to 272,000 tokens, within the model's limits.",
  FULL_DESCRIPTION: "Use the model's full context window. Larger requests may cost more.",
  HELPER:
    'Output and a safety margin are reserved inside the window. When automatic summarization is enabled, compaction starts at 90% of usable input.',
  IDENTICAL_HINT: "This model's window is ≤ 272k, so Full and Balanced are identical.",
  APPLIES_NEXT:
    'Applies to the next message in this conversation. Runs already in progress keep their original settings.',
  NO_PERMISSION: "You don't have permission to change this conversation's context settings.",
};

export const CONTEXT_MESSAGES = {
  HIGH_USAGE_WARNING: 'Context usage is high. Consider configuring budget settings.',
  DEFAULT_SUMMARY_INSTRUCTION: 'Generate a concise summary of the following conversation messages.',
};

export const DEFAULT_CONTEXT_STRATEGY = {
  ENABLED: true,
  CONTEXT_WINDOW_MODE: 'balanced',
  PRESERVE_RECENT_MESSAGES: 5,
  PRESERVE_SYSTEM_MESSAGES: true,
  ENABLE_SUMMARIZATION: true,
  ENABLE_CONTEXT_EDITING: false,
  SYSTEM_MESSAGES: '',
};

export const VALIDATION_LIMITS = {
  PRESERVE_RECENT_MESSAGES: {
    MIN: 1,
    MAX: 99,
  },
  MAX_TOKENS: {
    MIN: 100,
    MAX: 4096,
  },
  MANUAL_MAX_CONTEXT_TOKENS: {
    MIN: 1000,
  },
};

export const TOOLTIP_CONFIG = {
  ATTENTION: {
    placement: 'top-start',
    maxWidth: '15rem',
    offset: [18, -10],
  },
  INFO: {
    placement: 'top',
  },
  COLLAPSED: {
    placement: 'top-start',
    maxWidth: '15.3125rem',
    offset: [0, -9],
  },
  COMPACT: {
    placement: 'top',
    maxWidth: '15.3125rem',
    offset: [35, 2],
  },
};
