import { forwardRef, memo } from 'react';

import { Box } from '@mui/material';

const TourCard = forwardRef((props, ref) => {
  const { children, sx, ...rest } = props;

  return (
    <Box
      ref={ref}
      sx={[tourCardStyles, ...[sx].flat()]}
      {...rest}
    >
      {children}
    </Box>
  );
});

TourCard.displayName = 'TourCard';

/** @type {MuiSx} */
const tourCardStyles = ({ palette }) => ({
  position: 'relative',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  padding: '1.5rem',
  borderRadius: '1rem',
  background: palette.background.interactiveTourPrompt.card,
  color: palette.text.secondary,
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
});

export default memo(TourCard);
