import { useTheme } from '@emotion/react';

export default function ExperienceIcon(props) {
  const theme = useTheme();
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill={theme.palette.icon.fill.primary}
      {...props}
    >
      <path
        d="M1.5 9.5H4V14.5H1.5V9.5ZM6.75 5.5H9.25V14.5H6.75V5.5ZM11.9375 1.5L11.9377 1.5C11.9377 1.5 11.9376 1.5 11.9375 1.5ZM12 1.5L14.5 1.5V14.5H12V1.5Z"
        stroke={theme.palette.icon.fill.default}
      />
      <path
        d="M1.5 9.5H4V14.5H1.5V9.5ZM6.75 5.5H9.25V14.5H6.75V5.5ZM11.9375 1.5L11.9377 1.5C11.9377 1.5 11.9376 1.5 11.9375 1.5ZM12 1.5L14.5 1.5V14.5H12V1.5Z"
        stroke="black"
        strokeOpacity="0.2"
      />
    </svg>
  );
}
