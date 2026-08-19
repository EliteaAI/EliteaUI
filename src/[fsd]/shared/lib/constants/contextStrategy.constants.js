export const SEPARATOR = '$$$';

export const CONTEXT_BUDGET = {
  HIGH_UTILIZATION_THRESHOLD: 1,
};

export const CONTEXT_MESSAGES = {
  HIGH_USAGE_WARNING: 'Context usage is high. Consider configuring budget settings.',
  DEFAULT_SUMMARY_INSTRUCTION: 'Generate a concise summary of the following conversation messages.',
};

export const DEFAULT_CONTEXT_STRATEGY = {
  ENABLED: true,
  MAX_CONTEXT_TOKENS: 64000,
  PRESERVE_RECENT_MESSAGES: 5,
  PRESERVE_SYSTEM_MESSAGES: true,
  ENABLE_SUMMARIZATION: true,
  ENABLE_CONTEXT_EDITING: false,
  SYSTEM_MESSAGES: '',
};

export const VALIDATION_LIMITS = {
  MAX_CONTEXT_TOKENS: {
    MIN: 1000,
    MAX: 10000000,
  },
  PRESERVE_RECENT_MESSAGES: {
    MIN: 1,
    MAX: 99,
  },
  MAX_TOKENS: {
    MIN: 100,
    MAX: 4096,
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
