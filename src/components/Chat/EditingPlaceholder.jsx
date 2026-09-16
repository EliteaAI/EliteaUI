import React from 'react';

import { Typography, useTheme } from '@mui/material';
import { Box } from '@mui/system';

import EditIcon from '../Icons/EditIcon';
import { Answer } from './StyledComponents';

const EditingPlaceholder = ({ title = 'Response editing...' }) => {
  const theme = useTheme();
  return (
    <Answer
      sx={{
        background: theme.palette.background.aiAnswer,
        width: '100%',
        borderRadius: '8px',
        padding: '12px 16px 12px 16px',
        position: 'relative',
        boxSizing: 'border-box',
        minHeight: '48px',
        flex: 1,
      }}
    >
      <Box
        data-testid="chat-canvas-editing-indicator"
        display="flex"
        borderRadius={'8px'}
        gap="8px"
        alignItems={'center'}
        border={`1px solid ${theme.palette.components.editingPlaceholder.border}`}
        padding="8px 12px"
      >
        <EditIcon
          sx={{ fontSize: '16px' }}
          fill={theme.palette.icon.info}
        />
        <Typography
          variant="bodyMedium"
          color="text.secondary"
        >
          {title}
        </Typography>
      </Box>
    </Answer>
  );
};

export default EditingPlaceholder;
