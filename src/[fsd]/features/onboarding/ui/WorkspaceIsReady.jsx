import { memo } from 'react';

import { Box, Button, Typography } from '@mui/material';

import WelcomeImage from '@/assets/chat-welcome.png';

const WorkspaceIsReady = memo(props => {
  const { onJumpIn } = props;

  return (
    <Box sx={styles.gradientBorder}>
      <Box sx={styles.cover}>
        <Box sx={styles.mainPanel}>
          <Box sx={styles.leftPart}>
            <Box
              component="img"
              src={WelcomeImage}
              alt="Elitea"
              sx={styles.image}
            />
            <Typography
              component="div"
              variant="bodyMedium"
              sx={styles.title}
            >
              Your Elitea workspace is ready!
            </Typography>
          </Box>
          <Button
            variant="elitea"
            color="primary"
            sx={styles.button}
            onClick={onJumpIn}
          >
            Jump in now!
          </Button>
        </Box>
      </Box>
    </Box>
  );
});

/** @type {MuiSx} */
const styles = {
  image: {
    width: '2rem',
  },
  title: {
    color: 'text.secondary',
  },
  gradientBorder: ({ palette }) => ({
    height: '4rem',
    width: '30rem',
    padding: '1px',
    borderRadius: '2.75rem',
    background: palette.background.welcome.outside,
  }),
  cover: {
    width: '100%',
    height: '100%',
    backgroundColor: 'background.default',
    borderRadius: 'calc(2.75rem - 1px)',
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
    padding: '1rem 1.25rem',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.625rem',
  }),
  leftPart: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '0.75rem',
  },
  message: {
    color: 'text.secondary',
  },
  button: {
    marginTop: 'auto',
  },
};

WorkspaceIsReady.displayName = 'Welcome';

export default WorkspaceIsReady;
