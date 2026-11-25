// Shared with scripts/storybookScreenshots.js, so no aliased imports here
export const SCREENSHOT_TAG = 'screenshot';

export const SCREENSHOT_SIZE = { width: 1366, height: 768 };

// Retina, so the saved screenshot lines up with the live screen pixel for pixel
export const SCREENSHOT_SCALE = 2;

export const SCREENSHOT_DIR = '__screenshots__';

// Each story is shot in both; the compare view shows the one of the toolbar's theme
export const SCREENSHOT_THEMES = ['light', 'dark'];

// a determinate CircularProgress is a progress ring that stays on the page, not loading
export const LOADING_SELECTOR =
  '.MuiSkeleton-root, .MuiCircularProgress-root:not(.MuiCircularProgress-determinate), .MuiLinearProgress-root';

export const SCREENSHOT_MODES = {
  live: 'live',
  side: 'side',
  baseline: 'baseline',
};
