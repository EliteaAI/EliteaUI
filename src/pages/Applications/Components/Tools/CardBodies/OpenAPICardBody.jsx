import { Box, Typography } from '@mui/material';

import { useTheme } from '@emotion/react';

export default function OpenAPICardBody({ tool, onClickShowActions, showActions }) {
  const theme = useTheme();

  return (
    <>
      {!!tool.settings.selected_tools?.length && (
        <Box
          sx={{ cursor: 'pointer' }}
          onClick={onClickShowActions}
        >
          <Typography
            variant="bodySmall"
            sx={{
              color: theme.palette.text.primary,
              '&:hover': {
                color: theme.palette.text.createButton,
              },
            }}
          >
            {showActions ? 'Hide Actions' : 'Show Actions'}
          </Typography>
        </Box>
      )}
    </>
  );
}
