import { memo } from 'react';

import { Box, Typography } from '@mui/material';

const IWModalEntityCardFullscreenText = memo(({ content }) => {
  const styles = iWModalEntityCardFullscreenTextStyles();
  return (
    <Box sx={[styles.textBlock, { height: '34rem', overflowY: 'auto' }]}>
      <Typography
        variant="bodySmall"
        sx={styles.fullScreenText}
        component="p"
      >
        {content}
      </Typography>
    </Box>
  );
});

IWModalEntityCardFullscreenText.displayName = 'IWModalEntityCardFullscreenText';

/** @type {MuiSx} */
const iWModalEntityCardFullscreenTextStyles = () => ({
  textBlock: ({ palette }) => ({
    border: `0.0625rem solid ${palette.border.lines}`,
    borderRadius: '0.5rem',
    padding: '.5rem 1rem',
  }),
  fullScreenText: ({ palette }) => ({
    color: palette.text.secondary,
    lineHeight: '1rem',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  }),
});

export default IWModalEntityCardFullscreenText;
