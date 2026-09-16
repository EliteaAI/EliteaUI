import { memo, useCallback, useState } from 'react';

import { Box } from '@mui/material';

import { BrandLogoConstants } from '@/[fsd]/shared/lib/constants';
import { useCustomTheme } from '@/[fsd]/shared/lib/hooks/useCustomTheme.hooks';
import DefaultAvatar from '@/assets/chat-welcome.png';
import DefaultWordmark from '@/assets/logo.svg?react';
import EliteAIcon from '@/components/Icons/EliteAIcon';

const { BRAND_LOGO_VARIANTS } = BrandLogoConstants;

/**
 * Renders the custom logo when the Custom theme is active and a logo is provided,
 * otherwise (or if the custom image fails to load) renders the default Elitea logo for the given variant.
 */
const BrandLogo = memo(props => {
  const { variant = BRAND_LOGO_VARIANTS.Icon, alt = 'Logo', sx = {} } = props;

  const { customLogo } = useCustomTheme();
  const [failedLogo, setFailedLogo] = useState(null);

  const handleError = useCallback(() => {
    setFailedLogo(customLogo);
  }, [customLogo]);

  const styles = brandLogoStyles(variant);

  if (customLogo && failedLogo !== customLogo) {
    return (
      <Box
        component="img"
        src={customLogo}
        alt={alt}
        onError={handleError}
        sx={[styles.image, sx]}
      />
    );
  }

  if (variant === BRAND_LOGO_VARIANTS.Wordmark) return <DefaultWordmark />;

  if (variant === BRAND_LOGO_VARIANTS.Avatar) {
    return (
      <Box
        component="img"
        src={DefaultAvatar}
        alt={alt}
        sx={[styles.image, sx]}
      />
    );
  }

  return <EliteAIcon sx={sx} />;
});

BrandLogo.displayName = 'BrandLogo';

const IMAGE_STYLES_BY_VARIANT = {
  [BRAND_LOGO_VARIANTS.Wordmark]: {
    display: 'block',
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  [BRAND_LOGO_VARIANTS.Avatar]: {
    display: 'block',
    flexShrink: 0,
    width: '2.25rem',
    height: '2.25rem',
    objectFit: 'contain',
  },
  // Mirrors SvgIcon sizing so existing `fontSize` styles keep working
  [BRAND_LOGO_VARIANTS.Icon]: {
    display: 'inline-block',
    flexShrink: 0,
    width: '1em',
    height: '1em',
    fontSize: '1.5rem',
    objectFit: 'contain',
  },
};

/** @type {MuiSx} */
const brandLogoStyles = variant => ({
  image: IMAGE_STYLES_BY_VARIANT[variant] ?? IMAGE_STYLES_BY_VARIANT[BRAND_LOGO_VARIANTS.Icon],
});

export default BrandLogo;
