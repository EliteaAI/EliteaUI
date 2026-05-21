import { memo, useCallback, useRef } from 'react';

import { Box, Typography } from '@mui/material';

const ToolItem = memo(props => {
  const { label, description, onClick, isActive, itemRef } = props;

  // Keep a stable ref callback so the Box ref doesn't change on every render.
  const itemRefLatest = useRef(itemRef);
  itemRefLatest.current = itemRef;
  const setRef = useCallback(el => {
    itemRefLatest.current?.(el);
  }, []);

  return (
    <Box
      ref={setRef}
      onClick={onClick}
      sx={toolItemStyles.container(isActive)}
    >
      <Typography
        variant="headingSmall"
        color="text.secondary"
        sx={toolItemStyles.label}
      >
        {label}
      </Typography>
      {description && (
        <Typography
          variant="bodySmall"
          color="text.default"
          sx={toolItemStyles.description}
        >
          {description}
        </Typography>
      )}
    </Box>
  );
});

ToolItem.displayName = 'ToolItem';

export default ToolItem;

/** @type {MuiSx} */
const toolItemStyles = {
  container:
    isActive =>
    ({ palette }) => ({
      display: 'flex',
      flexDirection: 'column',
      padding: '0.5rem 0.75rem',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      background: isActive
        ? palette.background.userInputBackgroundActive
        : palette.background.userInputBackground,
      '&:hover': { background: palette.background.userInputBackgroundActive },
    }),
  label: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  description: {
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 1,
  },
};
