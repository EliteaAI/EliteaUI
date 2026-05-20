import { memo } from 'react';

import { Box } from '@mui/material';

const SPOTLIGHT_PADDING = 10; // px of breathing room around the target element
const BORDER_WIDTH_PX = 2;

const InteractiveTourSpotlight = memo(props => {
  const { targetRect, borderRadius } = props;
  const hasTarget = !!targetRect;

  return (
    <>
      {/* Full-screen blocker — absorbs all clicks, dims the screen for center placement */}
      <Box sx={blockerSx(hasTarget)} />

      {/* Spotlight — transparent box with dim shadow + gradient ring via ::before */}
      {hasTarget && <Box sx={spotlightSx(targetRect, borderRadius)} />}
    </>
  );
});

InteractiveTourSpotlight.displayName = 'InteractiveTourSpotlight';

const blockerSx =
  hasTarget =>
  ({ zIndex, palette }) => ({
    position: 'fixed',
    inset: 0,
    zIndex: zIndex.modal + 1,
    pointerEvents: 'auto',
    backgroundColor: hasTarget ? 'transparent' : palette.background.interactiveTourPrompt.backdrop,
  });

const spotlightSx =
  (targetRect, borderRadius) =>
  ({ zIndex, palette }) => ({
    position: 'fixed',
    top: targetRect.top - SPOTLIGHT_PADDING,
    left: targetRect.left - SPOTLIGHT_PADDING,
    width: targetRect.width + SPOTLIGHT_PADDING * 2,
    height: targetRect.height + SPOTLIGHT_PADDING * 2,
    borderRadius: borderRadius || '0.75rem',
    zIndex: zIndex.modal + 2,
    pointerEvents: 'none',
    background: 'transparent',
    transition:
      'top 0.35s cubic-bezier(0.4, 0, 0.2, 1), left 0.35s cubic-bezier(0.4, 0, 0.2, 1), width 0.35s cubic-bezier(0.4, 0, 0.2, 1), height 0.35s cubic-bezier(0.4, 0, 0.2, 1), border-radius 0.35s cubic-bezier(0.4, 0, 0.2, 1)',

    // Dim everything outside via a huge outward box-shadow.
    // The main element stays transparent so the target content is visible.
    boxShadow: `0 0 0 9999px ${palette.background.interactiveTourPrompt.backdrop}`,

    // Gradient ring via ::before pseudo-element — standard CSS-Tricks technique.
    // The pseudo-element fills the box with the gradient, then a two-layer mask
    // (content-box XOR border-box) clips it down to only the BORDER_WIDTH_PX ring.
    // ::before is independent of the main element's box-shadow, so the shadow
    // is never clipped by the mask.
    '&::before': {
      content: '""',
      position: 'absolute',
      inset: 0,
      borderRadius: 'inherit',
      padding: `${BORDER_WIDTH_PX}px`,
      background: palette.background.interactiveTourPrompt.borderGradient,
      // Clip to padding area only (= the ring), hide the content-box center
      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
      WebkitMaskComposite: 'xor',
      mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
      maskComposite: 'exclude',
    },
  });

export default InteractiveTourSpotlight;
