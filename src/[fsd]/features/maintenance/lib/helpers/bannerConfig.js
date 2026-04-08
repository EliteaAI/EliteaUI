import {
  VITE_MAINTENANCE_BANNER,
  VITE_MAINTENANCE_END,
  VITE_MAINTENANCE_MESSAGE,
  VITE_MAINTENANCE_START,
} from '@/[fsd]/features/maintenance/lib/constants';

import { DEFAULT_BANNER_STYLE } from './bannerStyleMap';

const DEFAULT_BANNER_CONFIG = {
  enabled: false,
  message: '',
  dismissible: true,
  style: DEFAULT_BANNER_STYLE,
  icon: 'warning',
};

const VALID_BANNER_ICONS = ['warning', 'info'];

const normalizeBannerIcon = icon => {
  if (typeof icon !== 'string') {
    return DEFAULT_BANNER_CONFIG.icon;
  }

  const normalized = icon.trim().toLowerCase();
  return VALID_BANNER_ICONS.includes(normalized) ? normalized : DEFAULT_BANNER_CONFIG.icon;
};

const normalizeBannerStyle = style => {
  if (typeof style !== 'string') {
    return DEFAULT_BANNER_CONFIG.style;
  }

  const normalizedStyle = style.trim().toLowerCase();
  return normalizedStyle || DEFAULT_BANNER_CONFIG.style;
};

const normalizeBannerConfig = config => ({
  ...config,
  style: normalizeBannerStyle(config?.style),
  icon: normalizeBannerIcon(config?.icon),
});

export const getMaintenanceBannerConfig = () => {
  if (VITE_MAINTENANCE_BANNER) {
    try {
      const parsed =
        typeof VITE_MAINTENANCE_BANNER === 'string'
          ? JSON.parse(VITE_MAINTENANCE_BANNER)
          : VITE_MAINTENANCE_BANNER;
      return normalizeBannerConfig({ ...DEFAULT_BANNER_CONFIG, ...parsed });
    } catch {
      return normalizeBannerConfig({
        ...DEFAULT_BANNER_CONFIG,
        enabled: true,
        message: String(VITE_MAINTENANCE_BANNER),
      });
    }
  }

  if (VITE_MAINTENANCE_START && VITE_MAINTENANCE_END) {
    const msg = VITE_MAINTENANCE_MESSAGE ? ` ${VITE_MAINTENANCE_MESSAGE}` : '';
    return normalizeBannerConfig({
      ...DEFAULT_BANNER_CONFIG,
      enabled: true,
      message: `From ${VITE_MAINTENANCE_START} to ${VITE_MAINTENANCE_END}${msg}`,
    });
  }

  return normalizeBannerConfig({ ...DEFAULT_BANNER_CONFIG });
};
