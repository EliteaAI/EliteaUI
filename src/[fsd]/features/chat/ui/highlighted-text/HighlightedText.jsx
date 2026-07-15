import { memo } from 'react';

import { Box } from '@mui/material';

const HighlightedText = memo(props => {
  const { text, ranges } = props;

  if (!ranges?.length || !text) return null;

  const children = [];
  let lastIndex = 0;

  for (const { start, end } of ranges) {
    if (start > lastIndex)
      children.push(
        <Box
          key={`plain-${start}`}
          component="span"
          sx={{ color: 'text.secondary' }}
        >
          {text.slice(lastIndex, start)}
        </Box>,
      );
    children.push(
      <Box
        key={`highlight-${start}`}
        component="span"
        sx={{ color: 'primary.main', borderRadius: '.25rem' }}
      >
        {text.slice(start, end)}
      </Box>,
    );
    lastIndex = end;
  }

  if (lastIndex < text.length)
    children.push(
      <Box
        key={`plain-end-${lastIndex}`}
        component="span"
        sx={{ color: 'text.secondary' }}
      >
        {text.slice(lastIndex)}
      </Box>,
    );

  return children;
});

HighlightedText.displayName = 'HighlightedText';

export default HighlightedText;
