import { memo } from 'react';

import { Box, Typography } from '@mui/material';

const ToolItem = memo(props => {
  const { label, description, onClick } = props;
  return (
    <Box
      onClick={onClick}
      sx={toolItemStyles.container}
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
  container: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    background: palette.background.userInputBackground,
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
