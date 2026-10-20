import { describe, expect, it } from 'vitest';

import {
  BANNER_ICON_MAP,
  BANNER_NO_ICON,
  getBannerIcon,
  getBannerIconGradient,
} from '../bannerStyleMap.helpers';

describe('getBannerIconGradient', () => {
  it('returns the palette gradient used for every banner icon', () => {
    const gradient = { start: 'orange', end: 'purple' };
    expect(getBannerIconGradient({ components: { banner: { icon: { gradient } } } })).toBe(gradient);
  });

  it('falls back to a solid color when the theme has no gradient', () => {
    expect(getBannerIconGradient({ components: {} })).toBeNull();
  });
});

describe('getBannerIcon', () => {
  it('returns the configured icon', () => {
    expect(getBannerIcon('info')).toBe(BANNER_ICON_MAP.info);
    expect(getBannerIcon('warning')).toBe(BANNER_ICON_MAP.warning);
  });

  it('returns null when the banner is configured without an icon', () => {
    expect(getBannerIcon(BANNER_NO_ICON)).toBeNull();
  });

  it('returns null for an empty icon value', () => {
    expect(getBannerIcon(null)).toBeNull();
    expect(getBannerIcon(undefined)).toBeNull();
    expect(getBannerIcon('')).toBeNull();
  });

  it('falls back to the warning icon for an unknown value', () => {
    expect(getBannerIcon('danger')).toBe(BANNER_ICON_MAP.warning);
  });
});
