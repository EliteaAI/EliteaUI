import { SvgIcon } from '@mui/material';

import { useTheme } from '@emotion/react';

export default function CalendarIcon(props) {
  const theme = useTheme();
  return (
    <SvgIcon
      viewBox="0 0 16 16"
      width="16"
      height="16"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.5 0C4.77614 0 5 0.223858 5 0.5V2H11V0.5C11 0.223858 11.2239 0 11.5 0C11.7761 0 12 0.223858 12 0.5V2H13.8333C14.4777 2 15 2.52233 15 3.16667V13.8333C15 14.4777 14.4777 15 13.8333 15H2.16667C1.52233 15 1 14.4777 1 13.8333V3.16667C1 2.52234 1.52233 2 2.16667 2H4V0.5C4 0.223858 4.22386 0 4.5 0ZM2.16667 3C2.07462 3 2 3.07462 2 3.16667V5.33333H14V3.16667C14 3.07462 13.9254 3 13.8333 3H2.16667ZM14 6.33333H2V13.8333C2 13.9254 2.07462 14 2.16667 14H13.8333C13.9254 14 14 13.9254 14 13.8333V6.33333Z"
        fill={theme.palette.background.button.primary.disabled}
      />
    </SvgIcon>
  );
}
