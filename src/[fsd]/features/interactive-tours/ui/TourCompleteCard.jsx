import { memo, useCallback } from 'react';

import { Box, Unstable_TrapFocus as TrapFocus, Typography } from '@mui/material';

import { useInteractiveTour } from '@/[fsd]/app/providers/InteractiveTourProvider';
import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import TutorialsSuccessIconDark from '@/assets/tutorials-success-icon-dark.svg?react';
import TutorialsSuccessIconLight from '@/assets/tutorials-success-icon-light.svg?react';
import { useTheme } from '@emotion/react';

import InteractiveTourBackdrop from './InteractiveTourBackdrop';
import TourCard from './TourCard';
import TourCardHeader from './TourCardHeader';

const TITLE_ID = 'tour-complete-title';

const TourCompleteCard = memo(props => {
  const { keepExploring = [] } = props;
  const { closeComplete, startTour } = useInteractiveTour();
  const theme = useTheme();
  const styles = tourCompleteCardStyles();
  const TutorialsSuccessIcon =
    theme.palette.mode === 'light' ? TutorialsSuccessIconLight : TutorialsSuccessIconDark;

  const handleKeyDown = useCallback(
    e => {
      if (e.key === 'Escape') {
        closeComplete?.();
      }
    },
    [closeComplete],
  );

  const handleKeepExploring = useCallback(
    e => {
      const { tourId } = e.currentTarget.dataset;
      if (tourId) {
        startTour(tourId);
      }
    },
    [startTour],
  );

  return (
    <InteractiveTourBackdrop>
      <TrapFocus open>
        <TourCard
          role="dialog"
          aria-modal="true"
          aria-labelledby={TITLE_ID}
          tabIndex={-1}
          onKeyDown={handleKeyDown}
          sx={styles.card}
        >
          <TourCardHeader
            icon={TutorialsSuccessIcon}
            titleId={TITLE_ID}
          >
            Tour Complete!
          </TourCardHeader>

          {keepExploring.length > 0 && (
            <Box sx={styles.keepExploringSection}>
              <Typography
                variant="headingSmall"
                sx={styles.keepExploringLabel}
              >
                Keep exploring:
              </Typography>

              <Box sx={styles.keepExploringList}>
                {keepExploring.map(item => (
                  <BaseBtn
                    key={item.tourId}
                    data-tour-id={item.tourId}
                    variant={BUTTON_VARIANTS.secondary}
                    onClick={handleKeepExploring}
                    sx={styles.keepExploringBtn}
                  >
                    {item.label}
                  </BaseBtn>
                ))}
              </Box>
            </Box>
          )}

          <Box sx={styles.footer}>
            <BaseBtn
              variant={BUTTON_VARIANTS.secondary}
              onClick={closeComplete}
            >
              Done!
            </BaseBtn>
          </Box>
        </TourCard>
      </TrapFocus>
    </InteractiveTourBackdrop>
  );
});

TourCompleteCard.displayName = 'TourCompleteCard';

/** @type {MuiSx} */
const tourCompleteCardStyles = () => ({
  card: {
    width: '27.5rem', // 440px
    pointerEvents: 'auto',
    '&:focus': { outline: 'none' },
  },

  keepExploringSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: '0.75rem',
    width: '100%',
    paddingTop: '0.25rem',
  },

  keepExploringLabel: ({ palette }) => ({
    color: palette.text.secondary,
    textAlign: 'center',
  }),

  keepExploringList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    width: '100%',
  },

  keepExploringBtn: ({ typography }) => ({
    alignSelf: 'stretch',
    borderRadius: '0.5rem',
    padding: '1rem 0',
    justifyContent: 'center',
    ...typography.labelMedium,
  }),

  footer: {
    display: 'flex',
    justifyContent: 'center',
    paddingTop: '0.75rem',
    width: '100%',
  },
});

export default TourCompleteCard;
