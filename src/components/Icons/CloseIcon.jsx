import SvgIcon from '@mui/material/SvgIcon';

import { useTheme } from '@emotion/react';

export default function CloseIcon(props) {
  const theme = useTheme();
  const { fill, ...other } = props;

  return (
    <SvgIcon
      viewBox="0 0 16 16"
      {...other}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.3352 3.66475C12.1156 3.44508 11.7594 3.44508 11.5398 3.66475L8 7.2045L4.46025 3.66475C4.24058 3.44508 3.88442 3.44508 3.66475 3.66475C3.44508 3.88442 3.44508 4.24058 3.66475 4.46025L7.2045 8L3.66475 11.5398C3.44508 11.7594 3.44508 12.1156 3.66475 12.3352C3.88442 12.5549 4.24058 12.5549 4.46025 12.3352L8 8.7955L11.5398 12.3352C11.7594 12.5549 12.1156 12.5549 12.3352 12.3352C12.5549 12.1156 12.5549 11.7594 12.3352 11.5398L8.7955 8L12.3352 4.46025C12.5549 4.24058 12.5549 3.88442 12.3352 3.66475Z"
        fill={fill || theme.palette.icon.fill.primary}
      />
    </SvgIcon>
  );
}
