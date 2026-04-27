import { Suspense, memo, useCallback, useEffect, useRef, useState } from 'react';

import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { Box, IconButton, LinearProgress, Typography } from '@mui/material';

import { Welcome, WorkspaceIsReady } from '@/[fsd]/features/onboarding/ui';
import { useLazyProjectListQuery } from '@/api';
import { useLazyAuthorDetailsQuery } from '@/api/social.js';
import Logo from '@/assets/logo.svg?react';
import ArrowBackIcon from '@/components/Icons/ArrowBackIcon';
import RouteDefinitions from '@/routes';
import { lazyWithRetry } from '@/utils/lazyWithRetry';

import LoadingPage from '../LoadingPage';

const ONBOARDING_STORAGE_KEY = 'onboarding_state';

const OnboardingTour = lazyWithRetry(() => import('@/[fsd]/features/onboarding/ui/OnboardingTour'));

const Onboarding = memo(() => {
  const user = useSelector(state => state.user);
  const progressIntervalIdRef = useRef(-1);
  const queryStatusIntervalIdRef = useRef(-1);
  const [thePrivateProjectIsReady, setThePrivateProjectIsReady] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [getUserDetails] = useLazyAuthorDetailsQuery();
  const [getProjectList] = useLazyProjectListQuery();

  // Check if user has clicked "Get Started" button before
  const hasClickedGetStarted = sessionStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
  const [showTour, setShowTour] = useState(hasClickedGetStarted || !!user.personal_project_id);
  const [progress, setProgress] = useState(5);

  const handleShowTour = useCallback(() => {
    // Save that user clicked "Get Started"
    sessionStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');

    if (!user.personal_project_id) {
      progressIntervalIdRef.current = setInterval(() => {
        setProgress(prev => (prev < 95 ? prev + 95 / 150 : prev));
      }, 1000);
      queryStatusIntervalIdRef.current = setInterval(async () => {
        const result = await getUserDetails().unwrap();
        if (result.personal_project_id) {
          clearInterval(queryStatusIntervalIdRef.current);
          queryStatusIntervalIdRef.current = -1;
          getProjectList();
          setThePrivateProjectIsReady(true);
        }
      }, 5000);
    }

    setShowTour(true);
  }, [user.personal_project_id, getUserDetails, getProjectList]);

  const onClearIntervals = useCallback(() => {
    if (progressIntervalIdRef.current !== -1) {
      clearInterval(progressIntervalIdRef.current);
      progressIntervalIdRef.current = -1;
    }
    if (queryStatusIntervalIdRef.current !== -1) {
      clearInterval(queryStatusIntervalIdRef.current);
      queryStatusIntervalIdRef.current = -1;
    }
  }, []);

  const handleJumpIn = () => {
    // Clear session storage when jumping in
    sessionStorage.removeItem(ONBOARDING_STORAGE_KEY);
    navigate(RouteDefinitions.Chat);
    onClearIntervals();
  };

  useEffect(() => {
    return () => {
      onClearIntervals();
    };
  }, [onClearIntervals]);

  // Restore progress intervals when page is refreshed with saved state
  useEffect(() => {
    if (!user.personal_project_id && showTour && !thePrivateProjectIsReady) {
      // Only start intervals if they're not already running
      if (progressIntervalIdRef.current === -1) {
        progressIntervalIdRef.current = setInterval(() => {
          setProgress(prev => (prev < 95 ? prev + 95 / 150 : prev));
        }, 1000);
      }
      if (queryStatusIntervalIdRef.current === -1) {
        queryStatusIntervalIdRef.current = setInterval(async () => {
          const result = await getUserDetails().unwrap();
          if (result.personal_project_id) {
            clearInterval(queryStatusIntervalIdRef.current);
            queryStatusIntervalIdRef.current = -1;
            getProjectList();
            setThePrivateProjectIsReady(true);
          }
        }, 5000);
      }
    }
  }, [user.personal_project_id, showTour, thePrivateProjectIsReady, getUserDetails, getProjectList]);

  useEffect(() => {
    if (user.personal_project_id) {
      onClearIntervals();
      setShowTour(true);
      // Clear session storage when personal project is ready
      sessionStorage.removeItem(ONBOARDING_STORAGE_KEY);
    }
  }, [onClearIntervals, user.personal_project_id]);

  return (
    <Box sx={styles.page}>
      {user.personal_project_id && location.state?.from && (
        <IconButton
          variant="alita"
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
            {!showTour && !user.personal_project_id && user.id && (
              <Welcome
                name={user.name || user.email}
                onShowTour={handleShowTour}
              />
            )}
            {showTour && (
              <Suspense
                fallback={
                  <Box sx={styles.loadingContainer}>
                    <LoadingPage />
                  </Box>
                }
              >
                <OnboardingTour />
              </Suspense>
            )}
            {!user.id && (
              <Box sx={styles.loadingContainer}>
                <LoadingPage />
              </Box>
            )}
          </Box>
        </Box>
        {showTour && !thePrivateProjectIsReady && (
          <Box sx={styles.footer}>
            <Box sx={styles.footerHead}>
              <Typography
                sx={styles.footerHeadStatus}
                variant="headingSmall"
              >
                Configuring Personal project...
              </Typography>
              <Typography
                sx={styles.footerHeadTime}
                variant="bodySmall"
              >
                about 5 min
              </Typography>
            </Box>
            <Box sx={styles.progressContainer}>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={styles.fileNameLinearProgress}
              />
            </Box>
          </Box>
        )}
        {thePrivateProjectIsReady && <WorkspaceIsReady onJumpIn={handleJumpIn} />}
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
  footer: {
    height: '2.875rem',
    width: '28.75rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerHead: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerHeadStatus: ({ palette }) => {
    const baseColor = palette.text.secondary;
    return {
      color: baseColor,
      fontWeight: 600,
      background: `linear-gradient(90deg, ${baseColor}55 0%, ${baseColor} 21.15%, ${baseColor}44 100%)`,
      backgroundSize: '200% 100%',
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      animation: 'shimmer 4s infinite linear',
      '@keyframes shimmer': {
        '0%': {
          backgroundPosition: '200% 0',
        },
        '100%': {
          backgroundPosition: '-200% 0',
        },
      },
    };
  },
  footerHeadTime: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  progressContainer: {
    width: '100%',
  },
  fileNameLinearProgress: ({ palette }) => ({
    height: '0.375rem',
    borderRadius: '0.1875rem',
    backgroundColor: palette.border.lines,
    '& .MuiLinearProgress-bar': {
      borderRadius: '0.1875rem',
    },
  }),
  loadingContainer: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

Onboarding.displayName = 'Onboarding';

export default Onboarding;
