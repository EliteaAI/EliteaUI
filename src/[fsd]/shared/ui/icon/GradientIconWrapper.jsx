import { memo } from 'react';

import { Box } from '@mui/material';

const GradientIconWrapper = memo(props => {
  const { children, size = '2.75rem', sx } = props;
  const styles = gradientIconWrapperStyles(size);

  return <Box sx={[styles.wrapper, ...(Array.isArray(sx) ? sx : [sx])]}>{children}</Box>;
});

GradientIconWrapper.displayName = 'GradientIconWrapper';

/** @type {MuiSx} */
const gradientIconWrapperStyles = size => ({
  wrapper: ({ palette }) => ({
    flexShrink: 0,
    width: size,
    height: size,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    background: palette.background.icon.entityGradient,
    color: palette.text.primary,
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      inset: 0,
      borderRadius: 'inherit',
      padding: '0.0625rem',
      background: palette.background.icon.entityBorderGradient,
      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
      WebkitMaskComposite: 'xor',
      maskComposite: 'exclude',
      pointerEvents: 'none',
    },
  }),
});

export default GradientIconWrapper;
