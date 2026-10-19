import { memo } from 'react';

import { Box } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import CloseIcon from '@/components/Icons/CloseIcon';

import BannerContent from './BannerContent';
import MaintenaceTipsContainer from './MaintenaceTipsContainer';

const TopBanner = memo(props => {
  const { banner, styleTokens, onClose } = props;

  const styles = topBannerStyles(styleTokens);

  return (
    <Box
      sx={styles.container}
      data-testid="platform-banner-top"
    >
      <MaintenaceTipsContainer sx={styles.bannerContainer}>
        <Box sx={styles.bannerContent}>
          <BannerContent
            banner={banner}
            styleTokens={styleTokens}
          />
        </Box>
        {banner.dismissible && (
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.tertiary}
            startIcon={<CloseIcon sx={styles.closeIcon} />}
            aria-label="close"
            onClick={onClose}
            data-testid="platform-banner-close"
          />
        )}
      </MaintenaceTipsContainer>
    </Box>
  );
});

TopBanner.displayName = 'TopBanner';

/** @type {MuiSx} */
const topBannerStyles = styleTokens => ({
  container: ({ palette }) => ({
    minHeight: '3.4375rem',
    position: 'absolute',
    top: '0.625rem',
    left: '1.5rem',
    right: '1.5rem',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2400,
    background: palette.background.default.secondary,
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
  },
  closeIcon: { fontSize: '1rem' },
});

export default TopBanner;
