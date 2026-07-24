import { memo, useMemo } from 'react';

import { Box, CircularProgress, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
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
    banner: { severity, label } = {},
    isIndexing,
    isStoppingIndexing,
    message = 'Some description of status, important details or instructions.',
    onStop,
  } = props;
  const styles = useMemo(() => getStyles(severity), [severity]);
  const Icon = IconMap[severity];
  return (
    <Box sx={styles.root}>
      <Box sx={styles.contentContainer}>
        <Box sx={styles.titleContainer}>
          {Icon && <Icon />}
          {severity === BannerSeverity.info && <CircularProgress size={16} />}
          {label && (
            <Typography
              sx={styles.title}
              variant="labelMedium"
            >
              {label}
            </Typography>
          )}
        </Box>
        <Typography
          sx={styles.message}
          variant="bodyMedium"
        >
          {message}
        </Typography>
      </Box>
      {isIndexing && (
        <Button.BaseBtn
          variant={Button.BUTTON_VARIANTS.alarm}
          onClick={onStop}
          disabled={isStoppingIndexing}
        >
          {!isStoppingIndexing ? 'Stop' : 'Stopping...'}
        </Button.BaseBtn>
      )}
    </Box>
  );
});

RunIndexBanner.displayName = 'RunIndexBanner';

/** @type {MuiSx} */
const getStyles = severity => ({
  root: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
  },
  contentContainer: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    gap: '0.375rem',
    padding: '0.75rem 1rem',
    background: ({ palette }) =>
      palette.background.indexResult[severity] || palette.background.indexResult.info,
    borderRadius: '0.75rem',
    border: ({ palette }) =>
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
