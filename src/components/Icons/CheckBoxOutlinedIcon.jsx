import { useTheme } from '@mui/material';

export default function CheckBoxOutlinedIcon(props) {
  const theme = useTheme();
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      stroke={theme.palette.icon.default}
      fill={theme.palette.icon.default}
      {...props}
    >
      <rect
        x="0.5"
        y="0.5"
        width="15"
        height="15"
        rx="2.5"
        stroke={props.stroke || theme.palette.icon.default}
      />
    </svg>
  );
}
