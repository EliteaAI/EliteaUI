import React, { useEffect, useState } from 'react';

import { Box, Typography } from '@mui/material';
import { keyframes } from '@mui/material/styles';

const PLACEHOLDER_MESSAGES = [
  'Waking the agent…',
  'Packing its tools…',
  'Wiring integrations…',
  'Fetching keys & creds…',
  'Installing skills…',
  'Learning your playbook…',
  'Safety checks on…',
  'Quick sandbox test…',
  'Final polish…',
];

// Wave animation keyframes
const waveAnimation = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
`;

const RotatingMessages = ({ sx = {}, duration = 2000 }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex(prevIndex => (prevIndex + 1) % PLACEHOLDER_MESSAGES.length);
    }, duration);

    return () => clearInterval(interval);
  }, [duration]);

  const currentMessage = PLACEHOLDER_MESSAGES[currentMessageIndex];

  // Split message into characters for individual animation
  const animatedChars = currentMessage.split('').map((char, index) => (
    <Box
      key={`${currentMessageIndex}-${index}`}
      component="span"
      sx={{
        display: 'inline-block',
        animation: `${waveAnimation} 2s ease-in-out infinite`,
        animationDelay: `${index * 0.1}s`,
        // Preserve spaces
        minWidth: char === ' ' ? '0.25em' : 'auto',
      }}
    >
      {char === ' ' ? '\u00A0' : char}
    </Box>
  ));

  return (
    <Typography
      sx={{
        fontWeight: '400',
        fontSize: '14px',
        lineHeight: '20px',
        color: 'text.secondary',
        ...sx,
      }}
    >
      {animatedChars}
    </Typography>
  );
};

export default RotatingMessages;
