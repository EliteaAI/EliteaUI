import { memo, useId } from 'react';

import { Box, useTheme } from '@mui/material';

import { getBannerIcon, getBannerIconGradient } from '@/[fsd]/features/maintenance/lib/helpers';

/**
 * Banner icon, painted with the palette's banner icon gradient via an SVG linearGradient running
 * from the bottom-left (start) to the top-right (end). Falls back to the style's solid color
 * when the theme defines no gradient.
 */
const BannerIcon = memo(props => {
  const { icon, size, styleTokens, sx = {} } = props;

  const { palette } = useTheme();
  // useId contains ':', which isn't safe inside CSS url(#...)
  const gradientId = `banner-icon-gradient-${useId().replace(/:/g, '')}`;

  const IconComponent = getBannerIcon(icon);
  const gradient = getBannerIconGradient(palette);

  if (!IconComponent) return null;

  const styles = bannerIconStyles(styleTokens, gradient ? gradientId : null);

  return (
    <Box
      component="span"
      sx={[styles.root, sx]}
      data-testid="platform-banner-icon"
    >
      {gradient && (
        <Box
          component="svg"
          aria-hidden
          sx={styles.defs}
        >
          <defs>
            <linearGradient
              id={gradientId}
              x1="0"
              y1="1"
              x2="1"
              y2="0"
            >
              <stop
                offset="0%"
                stopColor={gradient.start}
              />
              <stop
                offset="100%"
                stopColor={gradient.end}
              />
            </linearGradient>
          </defs>
        </Box>
      )}
      <IconComponent
        width={size}
        height={size}
        fill={styleTokens.iconColor}
      />
    </Box>
  );
});

BannerIcon.displayName = 'BannerIcon';

/** @type {MuiSx} */
const bannerIconStyles = (styleTokens, gradientId) => ({
  root: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    verticalAlign: 'middle',
    color: styleTokens.accentColor,
    ...(gradientId && { '& path': { fill: `url(#${gradientId})` } }),
  },
  defs: {
    position: 'absolute',
    width: 0,
    height: 0,
    overflow: 'hidden',
  },
});

export default BannerIcon;
