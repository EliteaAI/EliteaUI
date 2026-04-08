import { SvgIcon } from '@mui/material';

import { useTheme } from '@emotion/react';

export default function ArrowDownMuiSvgIcon(props) {
  const theme = useTheme();

  return (
    <SvgIcon
      viewBox="0 0 16 16"
      {...props}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill={theme.palette.icon.fill.primary}
        {...props}
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M2.64645 5.64645C2.84171 5.45118 3.15829 5.45118 3.35355 5.64645L8 10.2929L12.6464 5.64645C12.8417 5.45118 13.1583 5.45118 13.3536 5.64645C13.5488 5.84171 13.5488 6.15829 13.3536 6.35355L8.70711 11C8.31658 11.3905 7.68342 11.3905 7.29289 11L2.64645 6.35355C2.45118 6.15829 2.45118 5.84171 2.64645 5.64645Z"
        />
      </svg>
    </SvgIcon>
  );
}
