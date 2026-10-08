import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button';

const AgentDescriptionText = memo(props => {
  const { description, isSmallHeight, open } = props;
  const textRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    setIsExpanded(false);
    setIsTruncated(false);
  }, [description]);

  useEffect(() => {
    if (!open || isExpanded) return;
    const raf = requestAnimationFrame(() => {
      if (textRef.current) {
        setIsTruncated(textRef.current.scrollHeight > textRef.current.clientHeight);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [open, isExpanded, description]);

  const handleToggle = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const styles = agentDescriptionTextStyles();

  return (
    <Box sx={styles.container}>
      <Typography
        ref={textRef}
        variant="bodySmall2"
        sx={styles.text(isSmallHeight, isExpanded)}
        data-testid="catalog-agent-modal-description"
      >
        {description}
      </Typography>
      {isTruncated && (
        <Box sx={styles.showMoreRow}>
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.auxiliary}
            onClick={handleToggle}
            data-testid="catalog-agent-modal-show-more-description"
          >
            <Typography variant="labelSmall">{isExpanded ? 'Show less' : 'Show more'}</Typography>
          </Button.BaseBtn>
        </Box>
      )}
    </Box>
  );
});

AgentDescriptionText.displayName = 'AgentDescriptionText';

/** @type {MuiSx} */
const agentDescriptionTextStyles = () => ({
  container: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  text:
    (isSmallHeight, isExpanded) =>
    ({ palette }) => ({
      textAlign: 'center',
      color: palette.text.metrics,
      lineHeight: '1.25rem',
      ...(isSmallHeight
        ? { width: '100%' }
        : {
            ...(!isExpanded && {
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }),
            ...(isExpanded && {
              width: '100%',
              maxHeight: '10rem',
              overflowY: 'auto',
            }),
          }),
    }),
  showMoreRow: {
    width: '100%',
    display: 'flex',
    justifyContent: 'flex-end',
  },
});

export default AgentDescriptionText;
