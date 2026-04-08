import SvgIcon from '@mui/material/SvgIcon';

import { useTheme } from '@emotion/react';

export default function UnpublishIcon(props) {
  const theme = useTheme();
  return (
    <SvgIcon {...props}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          fill={props.fill || theme.palette.icon.fill.default}
          d="M13.9422 8C13.9422 11.2818 11.2818 13.9422 8 13.9422C6.54542 13.9422 5.21291 13.4196 4.18001 12.5519L12.5519 4.18001C13.4196 5.21291 13.9422 6.54542 13.9422 8ZM3.43348 11.8025L11.8025 3.43348C10.772 2.57453 9.44637 2.05777 8 2.05777C4.7182 2.05777 2.05777 4.7182 2.05777 8C2.05777 9.44637 2.57453 10.772 3.43348 11.8025ZM15 8C15 11.866 11.866 15 8 15C4.13401 15 1 11.866 1 8C1 4.13401 4.13401 1 8 1C11.866 1 15 4.13401 15 8Z"
        />
      </svg>
    </SvgIcon>
  );
}
