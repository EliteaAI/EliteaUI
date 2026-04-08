import { Suspense, memo } from 'react';

import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { Box, IconButton } from '@mui/material';

import Logo from '@/assets/logo.svg?react';
import ArrowBackIcon from '@/components/Icons/ArrowBackIcon';
import { lazyWithRetry } from '@/utils/lazyWithRetry';

import LoadingPage from '../LoadingPage';

const OnboardingTour = lazyWithRetry(() => import('@/[fsd]/features/onboarding/ui/OnboardingTour'));

const Tips = memo(() => {
  const user = useSelector(state => state.user);

  const navigate = useNavigate();
  const location = useLocation();

  // Check if user has clicked "Get Started" button before

  return (
    <Box sx={styles.page}>
      {user.personal_project_id && location.state?.from && (
        <IconButton
          variant="elitea"
          color={'tertiary'}
          onClick={() => navigate(-1)}
          sx={styles.backButton}
        >
          <ArrowBackIcon />
        </IconButton>
      )}
      <Box sx={styles.body}>
        <Box sx={styles.logo}>
          <Logo />
        </Box>
        <Box sx={styles.gradientBorder}>
          <Box sx={styles.mainPanel}>
            <Suspense
              fallback={
                <Box sx={styles.loadingContainer}>
                  <LoadingPage />
                </Box>
              }
            >
              <OnboardingTour />
            </Suspense>
          </Box>
        </Box>
      </Box>
    </Box>
  );
});

/** @type {MuiSx} */
const styles = {
  page: ({ palette }) => ({
    width: '100%',
    minWidth: '64rem',
    height: '100vh',
    minHeight: '48rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'auto',
    background: palette.background.default,
    position: 'relative',
  }),
  backButton: {
    position: 'absolute',
    top: '1rem',
    left: '1.5rem',
    zIndex: 10,
  },
  body: {
    width: '100%',
    maxWidth: '53.75rem',
    boxSizing: 'border-box',
    height: '40rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: '2rem',
  },
  logo: {
    width: '6.1875rem',
    height: '1.25rem',
  },
  gradientBorder: ({ palette }) => ({
    height: '32.5rem',
    minHeight: '32.5rem',
    width: '100%',
    padding: '1px',
    borderRadius: '1.5rem',
    background: palette.background.onboarding,
    boxShadow: palette.boxShadow.onboarding,
  }),
  mainPanel: ({ palette }) => ({
    width: '100%',
    height: '100%',
    background: palette.background.onboardingBody,
    borderRadius: 'calc(1.5rem - 1px)',
    padding: '2rem 2rem 1.25rem 2rem',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  }),
  loadingContainer: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

Tips.displayName = 'Tips';

export default Tips;
