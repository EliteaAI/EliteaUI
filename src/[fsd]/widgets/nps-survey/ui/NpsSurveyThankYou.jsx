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
  container: {
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
    background: 'linear-gradient(to top, #f7d9ff, #d5e3fe)',
    border: '1px solid #93b2ff',
    width: '27.375rem',
  },
  iconWrapper: {
    width: '1.5rem',
    height: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: '"Montserrat", sans-serif',
    fontWeight: 600,
    fontSize: '0.875rem',
    lineHeight: '1.5rem',
    color: '#0E131D',
    textAlign: 'center',
  },
};

export default NpsSurveyThankYou;
