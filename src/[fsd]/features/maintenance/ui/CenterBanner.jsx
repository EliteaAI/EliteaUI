import { memo } from 'react';

import { Box, Dialog } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

import BannerContent from './BannerContent';
import MaintenaceTipsContainer from './MaintenaceTipsContainer';

/**
 * Banner card in the middle of the screen. It has no backdrop / Escape close on purpose:
 * the user acknowledges it with the button (or can't close it at all when it isn't dismissible).
 */
const CenterBanner = memo(props => {
  const { banner, styleTokens, onClose } = props;

  const styles = centerBannerStyles(styleTokens);

  return (
    <Dialog
      open
      disableEscapeKeyDown
      maxWidth={false}
      data-testid="platform-banner-center"
      slotProps={{ paper: { sx: styles.paper } }}
    >
      <MaintenaceTipsContainer sx={styles.frame}>
        <Box sx={styles.body}>
          <BannerContent
            banner={banner}
            styleTokens={styleTokens}
            sideIcon
          />
        </Box>
        {banner.dismissible && (
          <Box sx={styles.actions}>
            <Button.BaseBtn
              variant={BUTTON_VARIANTS.elitea}
              color={BUTTON_COLORS.primary}
              onClick={onClose}
              data-testid="platform-banner-close"
            >
              Got it
            </Button.BaseBtn>
          </Box>
        )}
      </MaintenaceTipsContainer>
    </Dialog>
  );
});

CenterBanner.displayName = 'CenterBanner';

/** @type {MuiSx} */
const centerBannerStyles = styleTokens => ({
  paper: {
    width: '42rem',
    maxWidth: 'calc(100vw - 2rem)',
    margin: '1rem',
    borderRadius: '1.5rem',
    background: 'transparent',
    boxShadow: 'none',
    overflow: 'visible',
  },
  frame: {
    '& > div > div': {
      alignItems: 'stretch !important',
      gap: '1.25rem',
      padding: '2rem 2.5rem',
      background: styleTokens.backgroundColor,
    },
  },
  body: {
    display: 'flex',
    alignItems: 'center',
    overflowY: 'auto',
    maxHeight: '60vh',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
});

export default CenterBanner;
