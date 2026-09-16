import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import HeartIcon from './HeartIcon';

const NpsSurveyThankYou = memo(() => (
  <Box sx={styles.container}>
    <Box sx={styles.iconWrapper}>
      <HeartIcon />
    </Box>
    <Typography sx={styles.text}>Thanks! Your feedback helps us improve.</Typography>
  </Box>
));

NpsSurveyThankYou.displayName = 'NpsSurveyThankYou';

/** @type {MuiSx} */
const styles = {
  container: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: '1rem',
    paddingBottom: '1.5rem',
    paddingLeft: '1.5rem',
    paddingRight: '1.5rem',
    borderRadius: '1rem',
    background: palette.components.npsSurvey.background,
    border: `0.0625rem solid ${palette.components.npsSurvey.border}`,
    width: '27.375rem',
  }),
  iconWrapper: {
    width: '1.5rem',
    height: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: ({ palette }) => ({
    fontFamily: '"Montserrat", sans-serif',
    fontWeight: 600,
    fontSize: '0.875rem',
    lineHeight: '1.5rem',
    color: palette.text.alwaysDark,
    textAlign: 'center',
  }),
};

export default NpsSurveyThankYou;
