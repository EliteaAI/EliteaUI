export const SEPARATOR = '$$$';

export const CONTEXT_BUDGET = {
  HIGH_UTILIZATION_THRESHOLD: 1,
  // Fallback only, when the server does not report compaction_threshold
  COMPACTION_RATIO: 0.9,
};

export const CONTEXT_WINDOW_MODES = {
  BALANCED: 'balanced',
  FULL: 'full',
};

// Mirrors the backend Balanced cap; used only for the just-switched model preview and the "identical" hint
export const BALANCED_WINDOW_TOKENS = 272000;

export const CONTEXT_WINDOW_COPY = {
  LABEL: 'Context window',
  BALANCED_DESCRIPTION: (balancedLabel = '272,000') => `Up to ${balancedLabel} tokens, Keeps costs down.`,
  FULL_DESCRIPTION: "The LLM's entire context window. Best for very long chats, but costs more.",
  HELPER:
    'Output and a safety margin are reserved inside the window. When automatic summarization is enabled, compaction starts at 90% of usable input.',
  SETTINGS_CAPTION:
    'Sets the default for new chats. To change it for a single chat, use its Context Management.',
  MODES_TOOLTIP: `Balanced: Keeps costs down.
Full: Uses the LLM’s entire context window. 
With both options, a safety margin is reserved so responses are not cut off.`,
  IDENTICAL_HINT: windowLabel => `This model’s window is ${windowLabel}, so Balanced and Full are the same.`,
  AVAILABLE_TOKENS_TOOLTIP: `Tokens available in this chat: the LLM’s context window minus the reserved safety margin.`,
  APPLIES_NEXT:
    'Applies to the next message in this conversation. Runs already in progress keep their original settings.',
  NO_PERMISSION: "You don't have permission to change this conversation's context settings.",
};

export const CONTEXT_MESSAGES = {
  HIGH_USAGE_WARNING: 'Context usage is high. Consider configuring budget settings.',
  HIGH_USAGE_BANNER_WITH_SUMMARIZATION:
    'This chat is nearing its context limit. Older messages will be summarized automatically. You can summarize now or consider configuring budget settings.',
  HIGH_USAGE_BANNER_WITHOUT_SUMMARIZATION:
    'This chat is nearing its context limit. Consider configuring budget settings or summarize manually.',
  SUMMARIZE_NOW: 'Summarize now',
  SUMMARIZE_CONFIRM: "This will summarize older messages. This can't be undone. Continue?",
  DEFAULT_SUMMARY_INSTRUCTION: 'Generate a concise summary of the following conversation messages.',
  COST_TOOLTIP:
    'Estimated from list prices for every LLM call in this chat, including tool use, sub-agents, and summaries. Deleting messages does not reduce the cost.',
  PARTIAL_COST_TOOLTIP: 'Some models have no price in the catalog.',
  NOT_TRACKED_TOOLTIP: 'Usage tracking started with this release; earlier messages are not counted.',
};

export const DEFAULT_CONTEXT_STRATEGY = {
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
    MAX: 10000000,
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
