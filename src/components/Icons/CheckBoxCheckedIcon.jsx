import { useTheme } from '@emotion/react';

export default function CheckBoxCheckedIcon(props) {
  const theme = useTheme();
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
      stroke={theme.palette.icon.fill.default}
      fill={theme.palette.icon.fill.default}
      {...props}
    >
      <rect
        width="16"
        height="16"
        rx="3"
        fill={props.fill || theme.palette.icon.fill.default}
      />
      <path
        d="M4.80035 8.21804L6.80035 10.3999L11.2004 5.59985"
        stroke={props.stroke || theme.palette.icon.fill.default}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
