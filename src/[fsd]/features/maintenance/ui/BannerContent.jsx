import { memo, useMemo } from 'react';

import Markdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

import { Box, Typography } from '@mui/material';

import { BANNER_CONTENT_LAYOUT } from '@/[fsd]/features/maintenance/lib/constants';
import { bannerMarkdownComponents } from '@/[fsd]/features/maintenance/lib/helpers';

import BannerIcon from './BannerIcon';

const ICON_SIZES = {
  [BANNER_CONTENT_LAYOUT.inline]: 16,
  [BANNER_CONTENT_LAYOUT.side]: 24,
  [BANNER_CONTENT_LAYOUT.stacked]: 32,
};

/**
 * Icon + Markdown message shared by every banner placement.
 * The icon is omitted when the banner is configured without one.
 */
const BannerContent = memo(props => {
  const { banner, styleTokens, layout = BANNER_CONTENT_LAYOUT.inline } = props;

  const processedMessage = useMemo(
    () => (banner.message ? banner.message.replace(/<br\s*\/?>/gi, '\n') : ''),
    [banner.message],
  );

  const iconSize = ICON_SIZES[layout] ?? ICON_SIZES[BANNER_CONTENT_LAYOUT.inline];

  const styles = bannerContentStyles(layout);

  return (
    <Box sx={styles.root}>
      <BannerIcon
        icon={banner.icon}
        size={iconSize}
        styleTokens={styleTokens}
        sx={styles.icon}
      />
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

const ROOT_STYLES = {
  [BANNER_CONTENT_LAYOUT.inline]: { display: 'inline' },
  [BANNER_CONTENT_LAYOUT.side]: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
    width: '100%',
    minWidth: 0,
  },
  [BANNER_CONTENT_LAYOUT.stacked]: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    width: '100%',
    minWidth: 0,
  },
};

/** @type {MuiSx} */
const bannerContentStyles = layout => {
  const isInline = layout === BANNER_CONTENT_LAYOUT.inline;
  const isStacked = layout === BANNER_CONTENT_LAYOUT.stacked;

  return {
    root: ROOT_STYLES[layout] ?? ROOT_STYLES[BANNER_CONTENT_LAYOUT.inline],
    icon: {
      marginRight: isInline ? '0.5rem' : 0,
    },
    text: ({ palette }) => ({
      display: isInline ? 'inline' : 'block',
      flex: isInline ? 'none' : 1,
      width: isStacked ? '100%' : 'auto',
      minWidth: 0,
      textAlign: isStacked ? 'center' : 'left',
      color: palette.text.secondary,
      wordBreak: 'break-word',
      ...(!isInline && { lineHeight: 1.6 }),
    }),
  };
};

export default BannerContent;
