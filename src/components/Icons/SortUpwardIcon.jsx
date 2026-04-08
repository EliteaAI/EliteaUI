import { SvgIcon } from '@mui/material';

import { useTheme } from '@emotion/react';

export default function SortUpwardIcon(props) {
  const theme = useTheme();
  return (
    <SvgIcon
      viewBox="0 0 18 18"
      width="18"
      height="18"
      {...props}
    >
      <path
        d="M5.25 12L9 15.75L12.75 12H5.25Z"
        fill={theme.palette.icon.fill.secondary}
      />
      <path
        d="M5.25 6L9 2.25L12.75 6H5.25Z"
        fill={theme.palette.icon.fill.default}
      />
    </SvgIcon>
  );
}
