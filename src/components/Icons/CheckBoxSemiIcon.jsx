import { useTheme } from '@emotion/react';

export default function CheckBoxSemiIcon(props) {
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
        d="M4 8H12"
        stroke="#0E131D"
        strokeWidth={props.stroke || '2'}
        strokeLinecap="round"
        strokeLinejoin="round"
      />{' '}
    </svg>
  );
}
