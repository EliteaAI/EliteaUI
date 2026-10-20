export const BANNER_PLACEMENT = {
  top: 'top',
  center: 'center',
  bottomRight: 'bottom_right',
};

export const BANNER_CONTENT_LAYOUT = {
  // icon inline with the first line of text (top bar)
  inline: 'inline',
  // icon in its own column, vertically centered next to the text block (corner banner)
  side: 'side',
  // icon above the text, everything centered (center banner)
  stacked: 'stacked',
};

export const BANNERS_DISMISSED_STORAGE_KEY = 'platform_banners_dismissed';

// Single-banner dismissal key used before multi-banner support (#6971); cleaned up on load
export const LEGACY_BANNER_STORAGE_KEY = 'maintenance_banner_dismissed';
