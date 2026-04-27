import { memo } from 'react';

import { Box, Button, Typography } from '@mui/material';

import WelcomeImage from '@/assets/chat-welcome.png';

const Welcome = memo(props => {
  const { name = 'there', onShowTour } = props;

  return (
    <Box sx={styles.container}>
      <Box
        component="img"
        src={WelcomeImage}
        alt="Elitea"
        sx={styles.image}
      />
      <Typography
        component="div"
        variant="headingMedium"
        sx={styles.title}
      >
        Welcome to Elitea!
      </Typography>
      <Box sx={styles.gradientBorder}>
        <Box sx={styles.cover}>
          <Box sx={styles.mainPanel}>
            <Typography
              variant="bodyMedium"
              component={'div'}
              sx={styles.message}
            >
              {`Hello, ${name}!`}
            </Typography>
            <Typography
              variant="bodyMedium"
              component={'div'}
              sx={styles.message}
            >
              We’re setting up your personal workspace — it’ll be ready in about 5 minutes. While we work our
              magic, take a quick tour through our onboarding slides!
            </Typography>
            <Typography
              variant="bodyMedium"
              component={'div'}
              sx={styles.message}
            >
              Ready to explore Elitea’s smart tools and tips?
            </Typography>
            <Button
              variant="alita"
              color="primary"
              sx={styles.button}
              onClick={onShowTour}
            >
              Sure, let’s go!
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
});

/** @type {MuiSx} */
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
    boxSizing: 'border-box',
    gap: '1.5rem',
    flex: 1,
  },
  image: {
    width: '4.09rem',
  },
  title: {
    color: 'text.secondary',
  },
  gradientBorder: ({ palette }) => ({
    height: '15.375rem',
    width: '42.5rem',
    padding: '1px',
    borderRadius: '1.5rem',
    background: palette.background.welcome.outside,
  }),
  cover: {
    width: '100%',
    height: '100%',
    backgroundColor: 'background.default',
    borderRadius: 'calc(1.5rem - 1px)',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  mainPanel: ({ palette }) => ({
    width: '100%',
    height: '100%',
    background: palette.background.welcome.inner,
    borderRadius: 'calc(1.5rem - 1px)',
    padding: '2rem 2rem 1.25rem 2rem',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '0.625rem',
  }),
  message: {
    color: 'text.secondary',
  },
  button: {
    marginTop: 'auto',
  },
};

Welcome.displayName = 'Welcome';

export default Welcome;
