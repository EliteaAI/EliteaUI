import { useTheme } from '@emotion/react';

export default function EllipseIcon(props) {
  const theme = useTheme();
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="4"
      height="4"
      viewBox="0 0 4 4"
      fill={theme.palette.icon.fill.primary}
      {...props}
    >
      <circle
        cx="2"
        cy="2"
        r="2"
      />
    </svg>
  );
}
