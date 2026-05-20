import { memo } from 'react';

import { Typography } from '@mui/material';

/** @type {MuiSx} */
const getStyles = () => ({
  highlightText: {
    color: ({ palette }) => palette.primary.main,
    borderRadius: '.25rem',
  },
});

const HighlightedText = memo(props => {
  const { text, ranges } = props;
  const styles = getStyles();

  if (!ranges?.length || !text) return null;

  const children = [];
  let lastIndex = 0;

  for (const { start, end } of ranges) {
    if (start > lastIndex)
      children.push(
        <Typography
          key={start}
          component="span"
          variant="labelMedium"
          color="text.secondary"
        >
          {text.slice(lastIndex, start)}
        </Typography>,
      );
    children.push(
      <Typography
        key={start}
        component="span"
        variant="labelMedium"
        sx={styles.highlightText}
      >
        {text.slice(start, end)}
      </Typography>,
    );
    lastIndex = end;
  }

  if (lastIndex < text.length)
    children.push(
      <Typography
        key={lastIndex}
        component="span"
        variant="labelMedium"
        color="text.secondary"
      >
        {text.slice(lastIndex)}
      </Typography>,
    );

  return children;
});

HighlightedText.displayName = 'HighlightedText';

export default HighlightedText;
