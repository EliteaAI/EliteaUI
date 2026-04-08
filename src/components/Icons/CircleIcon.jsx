import { useTheme } from '@emotion/react';

export default function CircleIcon(props) {
  const theme = useTheme();
  const { size, ...rest } = props;
  return (
    <svg
      width={size || '100%'}
      height={size || '100%'}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <circle
        cx="8"
        cy="8"
        r="8"
        fill={props.fill || theme.palette.icon.fill.default}
      />
    </svg>
  );
}
