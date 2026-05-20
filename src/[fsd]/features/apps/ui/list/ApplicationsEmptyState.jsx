import { memo, useCallback } from 'react';

import { useNavigate } from 'react-router-dom';

import { Box, Typography, useTheme } from '@mui/material';

import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import applicationsDarkImage from '@/assets/images/Applications_Dark 1.png';
import applicationsLightImage from '@/assets/images/Applications_Light 1.png';
import PlusIcon from '@/assets/plus-icon.svg?react';
import RouteDefinitions from '@/routes';

const ApplicationsEmptyState = memo(() => {
  const theme = useTheme();
  const navigate = useNavigate();
  const styles = applicationsEmptyStateStyles();
  const isDarkMode = theme.palette.mode === 'dark';

  const handleCreateClick = useCallback(() => {
    navigate(RouteDefinitions.AppsCatalog);
  }, [navigate]);

  const handleGuidedTourClick = useCallback(() => {
    // TODO: Implement guided tour logic
  }, []);

  return (
    <Box sx={styles.container}>
      <Box
        component="img"
        src={isDarkMode ? applicationsDarkImage : applicationsLightImage}
        alt="No applications"
        sx={styles.image}
      />

      <Typography
        variant="headingSmall"
        sx={styles.title}
      >
        No applications yet
      </Typography>

      <Typography sx={styles.description}>
        Create your first app to build AI-powered solutions for specific tasks. Or take a quick tour to get
        started.
      </Typography>

      <Box sx={styles.actions}>
        <BaseBtn
          variant={BUTTON_VARIANTS.special}
          onClick={handleCreateClick}
        >
          <PlusIcon /> Create
        </BaseBtn>
        <BaseBtn
          variant={BUTTON_VARIANTS.secondary}
          onClick={handleGuidedTourClick}
        >
          Start Guided Tour
        </BaseBtn>
      </Box>
    </Box>
  );
});

ApplicationsEmptyState.displayName = 'ApplicationsEmptyState';

/** @type {MuiSx} */
const applicationsEmptyStateStyles = () => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    py: '3rem',
    px: '1.5rem',
    textAlign: 'center',
  },
  image: {
    width: '15rem',
    height: 'auto',
    mb: '1rem',
  },
  title: ({ palette }) => ({
    color: palette.text.secondary,
    fontSize: '1.125rem',
    fontWeight: 600,
  }),
  description: ({ palette }) => ({
    color: palette.background.tooltip.default,
    fontSize: '0.875rem',
    lineHeight: 1.5,
    maxWidth: '24rem',
  }),
  actions: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
    mt: '0.5rem',
  },
});

export default ApplicationsEmptyState;
