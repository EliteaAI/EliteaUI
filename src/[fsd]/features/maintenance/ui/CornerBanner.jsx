import { memo, useEffect } from 'react';

import { useDispatch } from 'react-redux';

import { Box } from '@mui/material';

import { BANNER_CONTENT_LAYOUT } from '@/[fsd]/features/maintenance/lib/constants';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import CloseIcon from '@/components/Icons/CloseIcon';
import { actions as settingsActions } from '@/slices/settings';

import BannerContent from './BannerContent';
import MaintenaceTipsContainer from './MaintenaceTipsContainer';

/** Square notification card in the bottom-right corner. */
const CornerBanner = memo(props => {
  const { banner, styleTokens, onClose } = props;

  const dispatch = useDispatch();

  // Holds the corner for as long as it is mounted; the NPS survey widget shows after it
  useEffect(() => {
    dispatch(settingsActions.setCornerBannerVisible(true));
    return () => {
      dispatch(settingsActions.setCornerBannerVisible(false));
    };
  }, [dispatch]);

  const styles = cornerBannerStyles(styleTokens);

  return (
    <Box
      sx={styles.container}
      data-testid="platform-banner-corner"
    >
      <MaintenaceTipsContainer sx={styles.frame}>
        <Box sx={styles.body}>
          <BannerContent
            banner={banner}
            styleTokens={styleTokens}
            layout={BANNER_CONTENT_LAYOUT.side}
          />
        </Box>
        {banner.dismissible && (
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.tertiary}
            startIcon={<CloseIcon sx={styles.closeIcon} />}
            aria-label="close"
            onClick={onClose}
            sx={styles.closeButton}
            data-testid="platform-banner-close"
          />
        )}
      </MaintenaceTipsContainer>
    </Box>
  );
});

CornerBanner.displayName = 'CornerBanner';

/** @type {MuiSx} */
const cornerBannerStyles = styleTokens => ({
  container: {
    position: 'fixed',
    bottom: '1.5rem',
    right: '1.5rem',
    zIndex: 1300,
    width: '26.875rem',
    maxWidth: 'calc(100vw - 3rem)',
  },
  frame: {
    borderRadius: '1rem',
    '& > div': {
      borderRadius: '0.9375rem',
    },
    '& > div > div': {
      flexDirection: 'row',
      alignItems: 'center',
      gap: '1rem',
      borderRadius: '0.9375rem',
      padding: '1rem 1.5rem',
      background: styleTokens.backgroundColor,
    },
  },
  body: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    overflowY: 'auto',
    maxHeight: '50vh',
  },
  closeButton: {
    flexShrink: 0,
  },
  closeIcon: { fontSize: '1rem' },
});

export default CornerBanner;
