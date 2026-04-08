import AttentionIcon from '@/assets/attention-icon.svg?react';
import InfoIcon from '@/assets/info.svg?react';

export const DEFAULT_BANNER_STYLE = 'warning';

export const BANNER_ICON_MAP = {
  warning: AttentionIcon,
  info: InfoIcon,
};

export const getBannerStyleMap = palette => ({
  warning: {
    iconColor: palette.warning.yellow,
    accentColor: palette.background.warning,
    backgroundColor: palette.background.banner.default,
  },
});
