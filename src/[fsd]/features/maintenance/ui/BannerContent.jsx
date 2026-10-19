import { memo, useMemo } from 'react';

import Markdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

import { Box, Typography } from '@mui/material';

import { BANNER_ICON_MAP, bannerMarkdownComponents } from '@/[fsd]/features/maintenance/lib/helpers';

/**
 * Icon + Markdown message shared by every banner placement.
 * `sideIcon` puts the icon in its own column, vertically centered next to the text block
 * (center / corner banners), instead of inline with the first line (top bar).
 */
const BannerContent = memo(props => {
  const { banner, styleTokens, sideIcon = false } = props;

  const processedMessage = useMemo(
    () => (banner.message ? banner.message.replace(/<br\s*\/?>/gi, '\n') : ''),
    [banner.message],
  );

  const IconComponent = BANNER_ICON_MAP[banner.icon] || BANNER_ICON_MAP.warning;
  const iconSize = sideIcon ? 24 : 16;

  const styles = bannerContentStyles(styleTokens, sideIcon);

  return (
    <Box sx={styles.root}>
      <Box
        component="span"
        sx={styles.icon}
      >
        <IconComponent
          width={iconSize}
          height={iconSize}
          fill={styleTokens.iconColor}
        />
      </Box>
      <Typography
        component="div"
        variant="bodyMedium"
        sx={styles.text}
      >
        <Markdown
          remarkPlugins={[remarkGfm, remarkBreaks]}
          components={bannerMarkdownComponents}
        >
          {processedMessage}
        </Markdown>
      </Typography>
    </Box>
  );
});

BannerContent.displayName = 'BannerContent';

/** @type {MuiSx} */
const bannerContentStyles = (styleTokens, sideIcon) => ({
  root: sideIcon
    ? { display: 'flex', alignItems: 'center', gap: '1.25rem', width: '100%', minWidth: 0 }
    : { display: 'inline' },
  icon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    verticalAlign: 'middle',
    marginRight: sideIcon ? 0 : '0.5rem',
    color: styleTokens.accentColor,
  },
  text: ({ palette }) => ({
    display: sideIcon ? 'block' : 'inline',
    flex: sideIcon ? 1 : 'none',
    minWidth: 0,
    textAlign: 'left',
    color: palette.text.secondary,
    wordBreak: 'break-word',
    ...(sideIcon && { lineHeight: 1.6 }),
  }),
});

export default BannerContent;
