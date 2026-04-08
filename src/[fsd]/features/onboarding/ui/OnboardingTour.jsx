import { memo, useState } from 'react';

import FullscreenOutlinedIcon from '@mui/icons-material/FullscreenOutlined';
import { Box, Dialog, DialogContent, IconButton, Typography } from '@mui/material';

import { onboardingTips } from '@/[fsd]/features/onboarding/lib/constants';
import TourContent from '@/[fsd]/features/onboarding/ui/TourContent';
import CloseIcon from '@/components/Icons/CloseIcon';

const OnboardingTour = memo(() => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isTourFullScreen, setIsTourFullScreen] = useState(false);

  const onNext = () => {
    if (currentStep < onboardingTips.length) {
      setCurrentStep(currentStep + 1);
    }
  };
  const onPrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onOpenTourFullScreen = () => {
    setIsTourFullScreen(true);
  };

  const onCloseTourFullScreen = () => {
    setIsTourFullScreen(false);
  };

  const handleKeyDown = event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onCloseTourFullScreen();
    }
  };

  return (
    <>
      <Box sx={styles.wrapper}>
        <IconButton
          variant="elitea"
          color="secondary"
          onClick={onOpenTourFullScreen}
          sx={styles.tourFullScreenButton}
          aria-label="View tour in full screen"
        >
          <FullscreenOutlinedIcon sx={{ fontSize: 20 }} />
        </IconButton>
        <Box sx={styles.container}>
          <TourContent
            currentStep={currentStep}
            onNext={onNext}
            onPrevious={onPrevious}
          />
        </Box>
      </Box>

      <Dialog
        fullScreen
        open={isTourFullScreen}
        onClose={onCloseTourFullScreen}
        onKeyDown={handleKeyDown}
        slotProps={tourDialogSlotProps}
      >
        <Box sx={styles.tourDialogHeader}>
          <Typography
            color="text.secondary"
            variant="headingMedium"
          >
            Onboarding tips
          </Typography>
          <IconButton
            variant="elitea"
            color="tertiary"
            onClick={onCloseTourFullScreen}
            aria-label="Close full screen tour"
            sx={styles.closeButton}
          >
            <CloseIcon sx={styles.closeIcon} />
          </IconButton>
        </Box>

        <DialogContent sx={styles.tourDialogContent}>
          <Box sx={styles.tourContentWrapper}>
            <TourContent
              currentStep={currentStep}
              onNext={onNext}
              onPrevious={onPrevious}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
});

/** @type {MuiSx} */
const styles = {
  wrapper: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    flex: 1,
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
    boxSizing: 'border-box',
    gap: '1.5rem',
    flex: 1,
    overflow: 'hidden',
  },
  tourFullScreenButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: 'background.paper',
    '&:hover': {
      backgroundColor: 'action.hover',
    },
  },
  closeButton: {
    marginLeft: '0rem',
  },
  closeIcon: {
    fontSize: '1rem',
  },
  tourDialogPaper: {
    backgroundColor: 'background.default',
  },
  tourDialogHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem 2rem',
    borderBottom: ({ palette }) => `.0625rem solid ${palette.border.lines}`,
    backgroundColor: 'background.secondary',
  },
  tourDialogContent: {
    padding: '3rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'background.default',
  },
  tourContentWrapper: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: '80rem',
    height: '100%',
    boxSizing: 'border-box',
    gap: '2rem',
  },
};

const tourDialogSlotProps = {
  paper: {
    sx: styles.tourDialogPaper,
  },
};

OnboardingTour.displayName = 'OnboardingTour';

export default OnboardingTour;
