import { memo, useMemo } from 'react';

import { Box, CircularProgress, Typography } from '@mui/material';

import ErrorIcon from '@/assets/error-icon.svg?react';
import FailIcon from '@/assets/fail-icon.svg?react';
import SuccessIcon from '@/assets/success-icon.svg?react';

import { BannerSeverity } from '../lib/constants';

const IconMap = {
  [BannerSeverity.success]: SuccessIcon,
  [BannerSeverity.warning]: FailIcon,
  [BannerSeverity.error]: ErrorIcon,
};

const RunIndexBanner = memo(props => {
  const {
    banner: {
      severity,
      label,
      message = 'Some description of status, important details or instructions.',
    } = {},
    showBottomBorder = true,
    fullBleed = false,
    CustomIcon,
    sx,
    contentSX,
  } = props;
  const styles = useMemo(
    () => getStyles(severity, showBottomBorder, fullBleed),
    [severity, showBottomBorder, fullBleed],
  );
  const Icon = IconMap[severity];
  return (
    <Box sx={[styles.root, sx]}>
      <Box sx={[styles.contentContainer, contentSX]}>
        <Box sx={styles.titleContainer}>
          {CustomIcon ? <CustomIcon /> : Icon && <Icon />}
          {severity === BannerSeverity.info && !CustomIcon && <CircularProgress size={16} />}
          {label && (
            <Typography
              sx={styles.title}
              variant="labelMedium"
            >
              {label}
            </Typography>
          )}
        </Box>
        {message && (
          <Typography
            sx={styles.message}
            variant="bodyMedium"
          >
            {message}
          </Typography>
        )}
      </Box>
    </Box>
  );
});

RunIndexBanner.displayName = 'RunIndexBanner';

const CARD_PRESENTATION = {
  root: { gap: '1rem', padding: '1rem 1.5rem' },
  content: { alignItems: 'stretch', padding: '0.75rem 1rem', borderRadius: '0.75rem' },
};

const FULL_BLEED_PRESENTATION = {
  root: { gap: 0, padding: 0 },
  content: { alignItems: 'center', textAlign: 'center', padding: '1rem 1.5rem', borderRadius: 0 },
};

/** @type {MuiSx} */
const getStyles = (severity, showBottomBorder, fullBleed) => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    ...(fullBleed ? FULL_BLEED_PRESENTATION.root : CARD_PRESENTATION.root),
    borderBottom: showBottomBorder ? ({ palette }) => `0.0625rem solid ${palette.border.table}` : 'none',
  },
  contentContainer: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    gap: '0.375rem',
    ...(fullBleed ? FULL_BLEED_PRESENTATION.content : CARD_PRESENTATION.content),
    background: ({ palette }) =>
      palette.background.indexResult[severity] || palette.background.indexResult.info,
    border: fullBleed
      ? 'none'
      : ({ palette }) =>
          `0.0625rem solid ${palette.border.indexResult[severity] || palette.border.indexResult.info}`,
  },
  titleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    color: ({ palette }) => palette.icon.indexResult[severity] || palette.icon.indexResult.info,
  },
  title: {
    color: ({ palette }) => palette.text.indexResult[severity] || palette.text.indexResult.info,
  },
  message: {
    color: ({ palette }) => palette.text.indexResult[severity] || palette.text.indexResult.info,
  },
});

export default RunIndexBanner;
