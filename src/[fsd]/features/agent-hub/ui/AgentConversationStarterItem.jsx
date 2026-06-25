import { memo, useCallback, useRef, useState } from 'react';

import { Box, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';

const AgentConversationStarterItem = memo(props => {
  const { text, onSelectStarter } = props;
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const textRef = useRef(null);
  const styles = starterItemStyles();

  const handleMouseEnter = useCallback(() => {
    if (textRef.current) {
      const isEllipsis = textRef.current.clientHeight < textRef.current.scrollHeight;
      setIsTooltipVisible(isEllipsis);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsTooltipVisible(false);
  }, []);

  const handleClick = useCallback(() => {
    onSelectStarter?.(text);
  }, [onSelectStarter, text]);

  const textContent = (
    <Typography
      ref={textRef}
      variant="bodySmall"
      sx={styles.starterText}
    >
      {text}
    </Typography>
  );

  return (
    <Box
      sx={styles.starterItem}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {isTooltipVisible ? (
        <Tooltip
          placement="top"
          title={text}
          extraStyles={{ maxWidth: '31.25rem' }}
          enterDelay={1000}
        >
          {textContent}
        </Tooltip>
      ) : (
        textContent
      )}
    </Box>
  );
});

AgentConversationStarterItem.displayName = 'AgentConversationStarterItem';

/** @type {MuiSx} */
const starterItemStyles = () => ({
  starterItem: ({ palette }) => ({
    padding: '0.75rem 1rem',
    borderRadius: '1rem',
    backgroundColor: palette.background.conversationStarters.default,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    minHeight: '2.5rem',
    display: 'flex',
    alignItems: 'center',
    '&:hover': {
      backgroundColor: palette.background.conversationStarters.hover,
    },
  }),
  starterText: ({ palette }) => ({
    color: palette.text.secondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    wordBreak: 'break-word',
  }),
});

export default AgentConversationStarterItem;
