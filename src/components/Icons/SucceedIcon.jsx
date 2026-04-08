import { useTheme } from '@emotion/react';

export default function SucceedIcon(props) {
  const theme = useTheme();
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill={theme.palette.icon.fill.primary}
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16.875 10C16.875 13.797 13.797 16.875 10 16.875C6.20304 16.875 3.125 13.797 3.125 10C3.125 6.20304 6.20304 3.125 10 3.125C13.797 3.125 16.875 6.20304 16.875 10ZM13.6691 8.82377C13.9687 8.53776 13.9798 8.06302 13.6938 7.76339C13.4078 7.46377 12.933 7.45273 12.6334 7.73873L8.94986 11.2548L7.36704 9.74394C7.06742 9.45794 6.59267 9.46898 6.30667 9.7686C6.02066 10.0682 6.0317 10.543 6.33132 10.829L8.43199 12.8342C8.72181 13.1108 9.17789 13.1108 9.46771 12.8342L13.6691 8.82377Z"
      />
    </svg>
  );
}
