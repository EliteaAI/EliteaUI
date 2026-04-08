import { useTheme } from '@emotion/react';

export default function CheckBoxIcon(props) {
  const theme = useTheme();
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      stroke={theme.palette.icon.fill.default}
      fill={theme.palette.icon.fill.default}
      {...props}
    >
      <rect
        width="16"
        height="16"
        rx="3"
        fill={props.fill || 'white'}
      />
      <path
        d="M4.80029 8.21804L6.80029 10.3999L11.2003 5.59985"
        stroke={props.stroke || '#0E131D'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
