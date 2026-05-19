import { memo, useCallback } from 'react';

import { Box, Unstable_TrapFocus as TrapFocus, Typography } from '@mui/material';

import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import TutorialsPromptIconDark from '@/assets/tutorials-prompt-icon-dark.svg?react';
import TutorialsPromptIconLight from '@/assets/tutorials-prompt-icon-light.svg?react';
import { useTheme } from '@emotion/react';

import InteractiveTourBackdrop from './InteractiveTourBackdrop';

const TITLE_ID = 'first-visit-prompt-title';
const DESCRIPTION_ID = 'first-visit-prompt-description';

const BODY_COPY =
  'Take a short interactive tour to learn how this section works and discover its key features.';

const FirstVisitPrompt = memo(props => {
  const { onSkip, onStart } = props;
  const theme = useTheme();
  const styles = firstVisitPromptStyles();
  const TutorialsPromptIcon =
    theme.palette.mode === 'light' ? TutorialsPromptIconLight : TutorialsPromptIconDark;

  const handleSkip = useCallback(() => {
    onSkip?.();
  }, [onSkip]);

  const handleStart = useCallback(() => {
    onStart?.();
  }, [onStart]);

  const handleKeyDown = useCallback(
    e => {
      if (e.key === 'Escape') {
        handleSkip();
      }
    },
    [handleSkip],
  );

  return (
    <InteractiveTourBackdrop>
      <TrapFocus open>
        <Box
          role="dialog"
          aria-modal="true"
          aria-labelledby={TITLE_ID}
          aria-describedby={DESCRIPTION_ID}
          onKeyDown={handleKeyDown}
          sx={styles.card}
        >
          <Box sx={styles.header}>
            <Box
              component={TutorialsPromptIcon}
              sx={styles.icon}
            />
            <Typography
              id={TITLE_ID}
              variant="headingMedium"
              color="text.secondary"
              align="center"
            >
              New here?
            </Typography>
          </Box>

          <Box sx={styles.divider} />

          <Box sx={styles.body}>
            <Typography
              id={DESCRIPTION_ID}
              variant="headingSmall"
              color="text.secondary"
              align="center"
            >
              {BODY_COPY}
            </Typography>
          </Box>

          <Box sx={styles.footer}>
            <BaseBtn
              variant={BUTTON_VARIANTS.secondary}
              onClick={handleSkip}
            >
              Skip
            </BaseBtn>
            <BaseBtn
              variant={BUTTON_VARIANTS.contained}
              onClick={handleStart}
            >
              Start!
            </BaseBtn>
          </Box>
        </Box>
      </TrapFocus>
    </InteractiveTourBackdrop>
  );
});

FirstVisitPrompt.displayName = 'FirstVisitPrompt';

/** @type {MuiSx} */
const firstVisitPromptStyles = () => ({
  card: ({ palette }) => ({
    position: 'relative',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    padding: '1.5rem',
    gap: '0.75rem',
    width: '27.5rem', // 440px
    borderRadius: '1rem',
    background: palette.background.interactiveTourPrompt.card,
    // Prevent backdrop click handler from firing when clicking inside the card
    pointerEvents: 'auto',
    // TrapFocus sets tabIndex="-1" and calls .focus() on this container; suppress the browser's
    // default focus ring (which ignores border-radius and appears as a plain white rectangle).
    '&:focus': { outline: 'none' },
    '&::before': {
      content: '""',
      position: 'absolute',
      inset: 0,
      borderRadius: 'inherit',
      padding: '0.0625rem',
      background: palette.background.interactiveTourPrompt.borderGradient,
      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
      WebkitMaskComposite: 'xor',
      maskComposite: 'exclude',
      pointerEvents: 'none',
    },
  }),

  header: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: '0.6rem',
    gap: '0.75rem',
  },

  icon: {
    width: '1.5rem',
    height: '1.5rem',
    flexShrink: 0,
    display: 'block',
  },

  divider: ({ palette }) => ({
    height: 0,
    borderBottom: '0.03125rem solid transparent',
    borderTop: '0.03125rem solid transparent',

    borderImageSlice: 1,
    borderImageSource: palette.background.interactiveTourPrompt.dividerGradient,
  }),

  body: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: '0.75rem',
  },

  footer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: '0.75rem',
    gap: '0.75rem',
  },
});

export default FirstVisitPrompt;
