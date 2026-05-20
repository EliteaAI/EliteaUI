import { memo, useCallback } from 'react';

import { Box, Unstable_TrapFocus as TrapFocus, Typography } from '@mui/material';

import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import TutorialsPromptIconDark from '@/assets/tutorials-prompt-icon-dark.svg?react';
import TutorialsPromptIconLight from '@/assets/tutorials-prompt-icon-light.svg?react';
import { useTheme } from '@emotion/react';

import InteractiveTourBackdrop from './InteractiveTourBackdrop';
import TourCard from './TourCard';
import TourCardHeader from './TourCardHeader';

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

  const handleKeyDown = useCallback(
    e => {
      if (e.key === 'Escape') {
        onSkip?.();
      }
    },
    [onSkip],
  );

  return (
    <InteractiveTourBackdrop>
      <TrapFocus open>
        <TourCard
          role="dialog"
          aria-modal="true"
          aria-labelledby={TITLE_ID}
          aria-describedby={DESCRIPTION_ID}
          onKeyDown={handleKeyDown}
          sx={styles.card}
        >
          <TourCardHeader
            icon={TutorialsPromptIcon}
            titleId={TITLE_ID}
          >
            New here?
          </TourCardHeader>

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
              onClick={onSkip}
            >
              Skip
            </BaseBtn>
            <BaseBtn
              variant={BUTTON_VARIANTS.contained}
              onClick={onStart}
            >
              Start!
            </BaseBtn>
          </Box>
        </TourCard>
      </TrapFocus>
    </InteractiveTourBackdrop>
  );
});

FirstVisitPrompt.displayName = 'FirstVisitPrompt';

/** @type {MuiSx} */
const firstVisitPromptStyles = () => ({
  card: {
    position: 'relative',
    alignItems: 'stretch',
    width: '27.5rem', // 440px
    pointerEvents: 'auto',
    '&:focus': { outline: 'none' },
  },

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
