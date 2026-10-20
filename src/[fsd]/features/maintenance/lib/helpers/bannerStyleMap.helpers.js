import AttentionIcon from '@/assets/attention-icon.svg?react';
import InfoIcon from '@/assets/info.svg?react';

export const DEFAULT_BANNER_STYLE = 'warning';

export const BANNER_ICON_MAP = {
  warning: AttentionIcon,
  info: InfoIcon,
};

// Admin "no icon" choice; null is treated the same way
export const BANNER_NO_ICON = 'none';

/** Icon component for the banner's `icon` value, or null when the banner is configured without one. */
export const getBannerIcon = icon => {
  if (!icon || icon === BANNER_NO_ICON) return null;
  return BANNER_ICON_MAP[icon] || BANNER_ICON_MAP.warning;
};

/** Gradient `{ start, end }` every banner icon is painted with; null (solid style color) when the theme has none. */
export const getBannerIconGradient = palette => palette.components?.banner?.icon?.gradient ?? null;

export const getBannerStyleMap = palette => ({
  warning: {
    iconColor: palette.icon.warningHigh,
    accentColor: palette.icon.warning,
    backgroundColor: palette.components.banner.background.default,
  },
  info: {
    iconColor: palette.icon.info,
    accentColor: palette.icon.info,
    backgroundColor: palette.components.banner.background.default,
  },
});
