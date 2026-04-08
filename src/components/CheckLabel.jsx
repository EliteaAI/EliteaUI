import { Box, Typography, useTheme } from '@mui/material';

import { Checkbox } from '@/[fsd]/shared/ui';

export default function CheckLabel({ label, ...props }) {
  const theme = useTheme();
  return (
    <Box sx={{ padding: '4px 0' }}>
      <Checkbox.BaseCheckbox
        size="small"
        name={props?.id}
        {...props}
      />
      <Typography
        variant="labelMedium"
        color={theme.palette.text.secondary}
      >
        {label}
      </Typography>
    </Box>
  );
}
