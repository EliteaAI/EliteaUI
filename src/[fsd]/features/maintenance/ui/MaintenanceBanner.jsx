import { memo, useCallback, useMemo, useState } from 'react';

import Markdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

import { Box, IconButton, Typography, useTheme } from '@mui/material';

import {
  BANNER_ICON_MAP,
  DEFAULT_BANNER_STYLE,
  bannerMarkdownComponents,
  getBannerStyleMap,
  getMaintenanceBannerConfig,
} from '@/[fsd]/features/maintenance/lib/helpers';
import { MaintenaceTipsContainer } from '@/[fsd]/features/maintenance/ui';
import CloseIcon from '@/components/Icons/CloseIcon';

const BANNER_STORAGE_KEY = 'maintenance_banner_dismissed';

const getInitialBannerVisibility = bannerConfig => {
  if (!bannerConfig.enabled || !bannerConfig.message) return false;

  const dismissedMessage = localStorage.getItem(BANNER_STORAGE_KEY);
  return dismissedMessage !== bannerConfig.message;
};

const MaintenanceBanner = memo(() => {
  const { palette } = useTheme();
  const bannerConfig = useMemo(() => getMaintenanceBannerConfig(), []);
  const [showBanner, setShowBanner] = useState(() => getInitialBannerVisibility(bannerConfig));
  const shouldHideBanner = !bannerConfig.enabled || !bannerConfig.message || !showBanner;

  const handleCloseBanner = useCallback(() => {
    localStorage.setItem(BANNER_STORAGE_KEY, bannerConfig.message);
    setShowBanner(false);
  }, [bannerConfig.message]);

  const processedMessage = useMemo(() => {
    if (!bannerConfig.message) return '';
    return bannerConfig.message.replace(/<br\s*\/?>/gi, '\n');
  }, [bannerConfig.message]);

  const styleMap = getBannerStyleMap(palette);
  const resolvedStyle = styleMap[bannerConfig.style] ? bannerConfig.style : DEFAULT_BANNER_STYLE;
  const styleTokens = styleMap[resolvedStyle];
  const styles = getStyles(styleTokens);
  const IconComponent = BANNER_ICON_MAP[bannerConfig.icon] || BANNER_ICON_MAP.warning;

  if (shouldHideBanner) return null;

  return (
    <Box sx={styles.container}>
      <MaintenaceTipsContainer sx={styles.bannerContainer}>
        <Box sx={styles.bannerContent}>
          <Typography
            component="div"
            variant="bodyMedium"
            sx={styles.bannerText}
          >
            <Box
              component="span"
              sx={styles.iconWrapper}
            >
              <IconComponent
                width={16}
                height={16}
                fill={styleTokens.iconColor}
              />
            </Box>
            <Markdown
              remarkPlugins={[remarkGfm, remarkBreaks]}
              components={bannerMarkdownComponents}
            >
              {processedMessage}
            </Markdown>
          </Typography>
        </Box>
        {bannerConfig.dismissible && (
          <IconButton
            variant="alita"
            color="secondary"
            aria-label="close"
            onClick={handleCloseBanner}
            sx={styles.closeButton}
          >
            <CloseIcon sx={styles.closeIcon} />
          </IconButton>
        )}
      </MaintenaceTipsContainer>
    </Box>
  );
});

MaintenanceBanner.displayName = 'MaintenanceBanner';

/** @type {MuiSx} */
const getStyles = styleTokens => ({
  container: ({ palette }) => ({
    minHeight: '3.4375rem',
    position: 'absolute',
    top: 10,
    left: 24,
    right: 24,
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1200,
    background: palette.background.default,
    borderRadius: '1rem',
  }),
  bannerContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    textAlign: 'left',
    borderRadius: '1rem',
    '& > div': {
      height: '100%',
      borderRadius: '1rem',
    },
    '& > div > div': {
      height: '100%',
      padding: '0.5rem 1rem',
      borderRadius: '1rem',

      flexDirection: 'row !important',
      justifyContent: 'space-between !important',
      background: styleTokens.backgroundColor,
      gap: '1rem',
    },
  },
  bannerContent: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    color: styleTokens.accentColor,
  },
  bannerText: {
    display: 'inline',
    flexWrap: 'wrap',
    color: 'text.secondary',
  },
  iconWrapper: {
    display: 'inline-flex',
    alignItems: 'center',
    verticalAlign: 'middle',
    marginRight: '0.5rem',
    color: styleTokens.accentColor,
  },
  closeButton: { padding: 0, margin: 0 },
  closeIcon: { fontSize: '1rem' },
});

export default MaintenanceBanner;
