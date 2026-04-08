import { memo } from 'react';

import { Box, IconButton, Typography } from '@mui/material';

import { onboardingTips } from '@/[fsd]/features/onboarding/lib/constants';
import ArrowLeftIcon from '@/assets/arrow-left-icon.svg?react';
import ArrowRightIcon from '@/assets/arrow-right-icon.svg?react';
import ReactMarkdown from '@/components/ReactMarkdown';

const TourContent = memo(props => {
  const { currentStep, onNext, onPrevious } = props;

  return (
    <>
      <Box sx={styles.imageWrapper}>
        <Box
          component="img"
          src={onboardingTips[currentStep - 1].image}
          alt="Elitea"
          sx={styles.image}
        />
      </Box>
      <Typography
        component="div"
        variant="bodyMedium"
        sx={styles.title}
      >
        <ReactMarkdown>{onboardingTips[currentStep - 1].tip}</ReactMarkdown>
      </Typography>
      <Box sx={styles.footer}>
        <IconButton
          variant="elitea"
          color="secondary"
          onClick={onPrevious}
          disabled={currentStep === 1}
          sx={styles.navButton}
        >
          <ArrowLeftIcon />
        </IconButton>
        <Typography
          variant="bodyMedium"
          sx={styles.pageIndicator}
        >
          {currentStep} / {onboardingTips.length}
        </Typography>
        <IconButton
          variant="elitea"
          color="secondary"
          onClick={onNext}
          disabled={currentStep === onboardingTips.length}
          sx={styles.navButton}
        >
          <ArrowRightIcon />
        </IconButton>
      </Box>
    </>
  );
});

TourContent.displayName = 'TourContent';

/** @type {MuiSx} */
const styles = {
  imageWrapper: {
    position: 'relative',
    flex: 1,
    width: '100%',
    minHeight: 0,
    display: 'flex',
  },
  image: {
    flex: 1,
    width: '100%',
    maxWidth: '100%',
    minHeight: 0,
    objectFit: 'contain',
  },
  title: {
    flexShrink: 0,
    width: '100%',
    textAlign: 'center',
    color: 'text.secondary',
    ' & p': {
      marginBottom: '0.25rem',
    },
  },
  footer: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    width: '100%',
  },
  navButton: {
    minWidth: '2rem',
    width: '2rem',
    height: '2rem',
    padding: 0,
    fontSize: '1.5rem',
    marginLeft: '0rem',
    color: 'text.secondary',
    '&:disabled': {
      color: 'text.disabled',
    },
  },
  pageIndicator: {
    color: 'text.primary',
    minWidth: '3rem',
    textAlign: 'center',
  },
};

export default TourContent;
