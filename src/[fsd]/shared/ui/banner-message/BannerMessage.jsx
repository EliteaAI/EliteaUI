import { memo, useCallback, useState } from 'react';

import { Box, Tooltip, Typography, useTheme } from '@mui/material';

import ErrorIcon from '@/assets/error-icon.svg?react';
import { BORDER_RADIUS } from '@/common/designTokens';
import AttentionIcon from '@/components/Icons/AttentionIcon';

const TIME_SHOW_TOOLTIP_MS = 1000;

const VARIANT_MAPPING = {
  WARNING: 'warning',
  ERROR: 'error',
  INFO: 'info',
};

const ICON_MAPPING = {
  [VARIANT_MAPPING.WARNING]: AttentionIcon,
  [VARIANT_MAPPING.ERROR]: ErrorIcon,
};

const BannerMessage = memo(props => {
  const { message, variant = VARIANT_MAPPING.WARNING } = props;
  const [expanded, setExpanded] = useState(false);
  const theme = useTheme();

  const styles = bannerMessageStyles(expanded, theme, variant);

  const handleToggle = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

  return (
    <Tooltip
      title={expanded ? '' : message}
      placement="top"
      enterDelay={TIME_SHOW_TOOLTIP_MS}
    >
      <Box
        sx={styles.container}
        onClick={handleToggle}
      >
        <Box
          component={ICON_MAPPING[variant]}
          sx={styles.icon}
        />
        <Typography
          variant="labelSmall"
          sx={styles.message}
        >
          {message}
        </Typography>
      </Box>
    </Tooltip>
  );
});

BannerMessage.displayName = 'BannerMessage';

export default BannerMessage;

const variantBannerMessagePalette = ({ palette }) => ({
  [VARIANT_MAPPING.WARNING]: {
    iconColor: palette.icon.fill.attention,
    background: palette.background.attention,
    border: palette.border.attention,
    text: palette.text.attention,
  },
  [VARIANT_MAPPING.ERROR]: {
    iconColor: palette.background.button.danger,
    background: palette.background.errorBkg,
    border: palette.background.wrongBkg,
    text: palette.text.warningText,
  },
});

/** @type {MuiSx} */
const bannerMessageStyles = (expanded, theme, variant) => {
  const styleVariant = variantBannerMessagePalette(theme)[variant] || {};

  return {
    container: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.75rem',
      padding: '0.5rem 0.75rem',
      backgroundColor: styleVariant?.background,
      border: `0.0625rem solid ${styleVariant?.border}`,
      borderRadius: BORDER_RADIUS.MD,
      marginTop: '0.5rem',
      cursor: 'pointer',
    },
    icon: {
      fontSize: '1rem',
      color: styleVariant?.iconColor,
      fill: styleVariant?.iconColor,
      flexShrink: 0,
    },
    message: {
      flex: 1,
      color: styleVariant?.text,
      overflow: 'hidden',
      display: '-webkit-box',
      WebkitBoxOrient: 'vertical',
      WebkitLineClamp: expanded ? undefined : 1,
      wordBreak: 'break-word',
    },
  };
};
