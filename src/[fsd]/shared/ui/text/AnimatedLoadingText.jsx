import { memo } from 'react';

import { Box, Typography } from '@mui/material';
import { keyframes } from '@mui/material/styles';

// Wave animation for loading text
const waveAnimation = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
`;

const AnimatedLoadingText = memo(props => {
  const { text } = props;

  return (
    <Typography
      variant="bodyMedium"
      color="text.secondary"
    >
      {text.split('').map((char, index) => (
        <Box
          key={index}
          component="span"
          sx={{
            display: 'inline-block',
            animation: `${waveAnimation} 2s ease-in-out infinite`,
            animationDelay: `${index * 0.1}s`,
            minWidth: char === ' ' ? '0.25em' : 'auto',
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </Box>
      ))}
    </Typography>
  );
});

AnimatedLoadingText.displayName = 'AnimatedLoadingText';

export default AnimatedLoadingText;
