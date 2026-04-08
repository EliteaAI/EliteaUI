import React from 'react';

import { Typography } from '@mui/material';
import { Box } from '@mui/system';

import { useTheme } from '@emotion/react';

import EditIcon from '../Icons/EditIcon';
import { Answer } from './StyledComponents';

const EditingPlaceholder = ({ title = 'Response editing...' }) => {
  const theme = useTheme();
  return (
    <Answer
      sx={{
        background: theme.palette.background.aiAnswerBkg,
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
        display="flex"
        borderRadius={'8px'}
        gap="8px"
        alignItems={'center'}
        border={`1px solid ${theme.palette.border.chatEditPlaceholderBorder}`}
        padding="8px 12px"
      >
        <EditIcon
          sx={{ fontSize: '16px' }}
          fill={theme.palette.border.chatEditPlaceholderBorder}
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
