import { memo } from 'react';

import { useTheme } from '@mui/material';

import { BANNER_PLACEMENT } from '@/[fsd]/features/maintenance/lib/constants';
import { DEFAULT_BANNER_STYLE, getBannerStyleMap } from '@/[fsd]/features/maintenance/lib/helpers';
import { usePlatformBanners } from '@/[fsd]/features/maintenance/lib/hooks';

import CenterBanner from './CenterBanner';
import CornerBanner from './CornerBanner';
import TopBanner from './TopBanner';

const PLACEMENT_COMPONENTS = {
  [BANNER_PLACEMENT.top]: TopBanner,
  [BANNER_PLACEMENT.center]: CenterBanner,
  [BANNER_PLACEMENT.bottomRight]: CornerBanner,
};

/** Shows the head of the platform banner queue in its configured placement. */
const PlatformBanner = memo(() => {
  const { palette } = useTheme();
  const { activeBanner, dismissBanner } = usePlatformBanners();

  if (!activeBanner) return null;

  const styleMap = getBannerStyleMap(palette);
  const styleTokens = styleMap[activeBanner.style] ?? styleMap[DEFAULT_BANNER_STYLE];
  const PlacementComponent = PLACEMENT_COMPONENTS[activeBanner.placement] ?? TopBanner;

  return (
    <PlacementComponent
      key={activeBanner.id}
      banner={activeBanner}
      styleTokens={styleTokens}
      onClose={dismissBanner}
    />
  );
});

PlatformBanner.displayName = 'PlatformBanner';

export default PlatformBanner;
