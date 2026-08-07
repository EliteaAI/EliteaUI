import { memo } from 'react';

import RestoreOutlinedIcon from '@mui/icons-material/RestoreOutlined';
import { Box, IconButton } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';

const RestoreButton = memo(props => {
  const { onClick, disabled, title, itemKey, sx } = props;
  return (
    <Tooltip
      title={title}
      placement="top"
    >
      <Box
        sx={sx}
        component="span"
      >
        <IconButton
          variant="elitea"
          color="tertiary"
          onClick={onClick}
          disabled={disabled}
          aria-label={`restore-service-prompt-default-${itemKey || ''}`}
        >
          <RestoreOutlinedIcon fontSize="small" />
        </IconButton>
      </Box>
    </Tooltip>
  );
});

RestoreButton.displayName = 'RestoreButton';

export default RestoreButton;
