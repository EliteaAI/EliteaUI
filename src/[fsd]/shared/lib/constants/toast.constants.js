export const DEFAULT_TOP_POSITION = '5.625rem';

export const TOAST_DURATION_DEFAULTS = {
  error: 10000,
  warning: 7000,
  success: 3000,
  info: 3000,
};

// Minimum time between two automatic closes, so that toasts never disappear all at once.
export const TOAST_STAGGER_GAP = 1500;

// How often the auto close scheduler checks the toasts.
export const TOAST_TICK_INTERVAL = 100;
