import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { Box, Link, Typography } from '@mui/material';

const ExpandableText = memo(props => {
  const { text, maxLines = 5 } = props;

  const [expanded, setExpanded] = useState(false);
  const [needsExpansion, setNeedsExpansion] = useState(false);
  const textRef = useRef(null);
  const checkedRef = useRef(false);

  const toggleExpanded = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

  useEffect(() => {
    checkedRef.current = false;
    setExpanded(false);
  }, [text]);

  useEffect(() => {
    if (checkedRef.current) return;

    const checkTruncation = () => {
      if (textRef.current && !expanded) {
        const element = textRef.current;
        const fullHeight = element.scrollHeight;
        const visibleHeight = element.clientHeight;

        const shouldExpand = fullHeight > visibleHeight;
        setNeedsExpansion(shouldExpand);
        checkedRef.current = true;
      }
    };

    const timeoutId = setTimeout(checkTruncation, 150);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [text, maxLines, expanded]);

  const styles = expandableTextStyles(maxLines, expanded);

  return (
    <Box sx={styles.container}>
      <Typography
        ref={textRef}
        variant="bodyMedium"
        sx={styles.text}
      >
        {text}
      </Typography>
      {needsExpansion && (
        <Link
          component="button"
          variant="labelSmall"
          onClick={toggleExpanded}
          sx={styles.expandLink}
        >
          {expanded ? 'Show less' : 'Show more'}
        </Link>
      )}
    </Box>
  );
});

ExpandableText.displayName = 'ExpandableText';

/** @type {MuiSx} */
const expandableTextStyles = (maxLines, expanded) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
  },
  text: ({ palette }) => ({
    color: palette.text.secondary,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    overflow: expanded ? 'visible' : 'hidden',
    WebkitLineClamp: expanded ? 'none' : maxLines,
    maxHeight: expanded ? 'none' : `${maxLines * 1.5}rem`,
  }),
  expandLink: ({ palette, typography }) => ({
    alignSelf: 'flex-start',
    marginTop: '0.5rem',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontFamily: typography.fontFamily,
    color: palette.background.button.primary.hover,
    '&:hover': {
      color: palette.text.button.showMore,
    },
  }),
});

export default ExpandableText;
