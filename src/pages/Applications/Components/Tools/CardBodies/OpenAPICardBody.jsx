import { Box, Typography, useTheme } from '@mui/material';

export default function OpenAPICardBody({ tool, onClickShowActions, showActions }) {
  const theme = useTheme();

  return (
    <>
      {!!tool.settings?.selected_tools?.length && (
        <Box
          sx={{ cursor: 'pointer' }}
          onClick={onClickShowActions}
        >
          <Typography
            variant="bodySmall"
            sx={{
              color: theme.palette.text.primary,
              '&:hover': {
                color: theme.palette.text.accent,
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
