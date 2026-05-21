import { memo, useCallback, useEffect, useRef } from 'react';

import { MuiMarkdown } from 'mui-markdown';

import { Box, Typography } from '@mui/material';

import { useInteractiveTour } from '@/[fsd]/app/providers/InteractiveTourProvider';
import { MarkdownMapping } from '@/[fsd]/shared/lib/utils/markdown.utils';
import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { keyframes } from '@emotion/react';

import { CARD_WIDTH_PX } from '../lib/constants';
import { useTourCardPosition } from '../lib/hooks';
import InteractiveTourSpotlight from './InteractiveTourSpotlight';
import TourCard from './TourCard';

// Fade-in animation played whenever the step content is mounted (key={stepIndex})
const stepFadeIn = keyframes({
  from: { opacity: 0, transform: 'translateY(0.375rem)' },
  to: { opacity: 1, transform: 'translateY(0)' },
});

const InteractiveTourCard = memo(() => {
  const { currentStep, stepIndex, totalSteps, next, back, skip } = useInteractiveTour();
  const styles = tourCardStyles();
  const { targetInfo, cardPositionSx, cardBodySx } = useTourCardPosition(currentStep);
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === totalSteps - 1;

  const dialogRef = useRef(null);
  const primaryActionRef = useRef(null);
  const previousFocusRef = useRef(null);

  // Capture the focused element when the tour starts, move focus to the primary
  // action on each step, and restore the original focus when the tour ends.
  useEffect(() => {
    if (!currentStep) {
      previousFocusRef.current?.focus?.();
      previousFocusRef.current = null;
      return;
    }
    if (!previousFocusRef.current) {
      previousFocusRef.current = document.activeElement;
    }
    primaryActionRef.current?.focus?.() ?? dialogRef.current?.focus();
  }, [currentStep]);

  // Keep Tab/Shift+Tab cycling within the dialog while the tour is active and
  // allow keyboard step navigation without requiring pointer interaction.
  const handleKeyDown = useCallback(
    e => {
      if (!dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );

      if (e.key === 'Tab') {
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
          return;
        }

        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
        return;
      }

      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
        return;
      }

      if (e.key === 'ArrowLeft') {
        if (!isFirstStep) {
          e.preventDefault();
          back();
        }
        return;
      }

      if (e.key === 'Enter' && document.activeElement === dialogRef.current) {
        e.preventDefault();
        next();
      }
    },
    [back, isFirstStep, next],
  );

  if (!currentStep) return null;

  return (
    <>
      <InteractiveTourSpotlight
        targetRect={targetInfo?.rect ?? null}
        borderRadius={targetInfo?.borderRadius}
      />

      <TourCard
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={currentStep.title || 'Interactive tour'}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        sx={[styles.card, cardPositionSx]}
      >
        <Box
          key={stepIndex}
          sx={styles.stepContent}
        >
          {currentStep.title && <Typography variant="headingMedium">{currentStep.title}</Typography>}

          <Box sx={[styles.body, cardBodySx]}>
            <MuiMarkdown overrides={MarkdownMapping}>{currentStep.content}</MuiMarkdown>
          </Box>
        </Box>

        <Box sx={styles.footer}>
          <Typography
            variant="labelSmall"
            sx={styles.counter}
          >
            {stepIndex + 1} / {totalSteps}
          </Typography>

          <Box sx={styles.footerButtons}>
            <BaseBtn
              variant={BUTTON_VARIANTS.tertiary}
              onClick={skip}
            >
              Skip
            </BaseBtn>
            <BaseBtn
              variant={BUTTON_VARIANTS.secondary}
              disabled={isFirstStep}
              onClick={back}
            >
              Back
            </BaseBtn>
            <BaseBtn
              variant={BUTTON_VARIANTS.contained}
              ref={primaryActionRef}
              onClick={next}
            >
              {isLastStep ? 'Finish' : 'Next'}
            </BaseBtn>
          </Box>
        </Box>
      </TourCard>
    </>
  );
});

InteractiveTourCard.displayName = 'InteractiveTourCard';

/** @type {MuiSx} */
const tourCardStyles = () => ({
  card: ({ zIndex: muiZIndex }) => ({
    outline: 0, // programmatic focus target; outline is on inner focusable elements
    position: 'fixed',
    zIndex: muiZIndex.modal + 3,
    width: `${CARD_WIDTH_PX / 16}rem`,
    maxWidth: '90vw',
    maxHeight: '80vh',
    overflow: 'hidden',
    // Smooth slide when the card repositions between steps
    transition: [
      'top 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
      'left 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
      'bottom 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
      'right 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
      'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
    ].join(', '),
  }),

  stepContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    flex: 1,
    minHeight: 0,
    animation: `${stepFadeIn} 0.25s ease forwards`,
  },

  body: {
    typography: 'bodyMedium',
    overflowY: 'auto',
    flex: 1,
    minHeight: 0,
  },

  footer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '0.5rem',
  },

  counter: ({ palette }) => ({
    color: palette.background.interactiveTourPrompt.counter,
  }),

  footerButtons: {
    display: 'flex',
    flexDirection: 'row',
    gap: '0.5rem',
    alignItems: 'center',
  },
});

export default InteractiveTourCard;
