import { Typography } from '@mui/material';
import Link from '@mui/material/Link';

const bannerMarkdownComponents = {
  p: ({ ...props }) => (
    <Typography
      component="span"
      variant="bodyMedium"
      {...props}
    />
  ),
  a: ({ ...props }) => (
    <Link
      target="_blank"
      rel="noopener noreferrer"
      variant="bodyMedium"
      sx={{ color: 'primary.main', textDecorationColor: 'currentcolor' }}
      {...props}
    />
  ),
  strong: ({ ...props }) => (
    <Typography
      component="strong"
      variant="headingSmall"
      sx={{ display: 'inline' }}
      {...props}
    />
  ),
  em: ({ ...props }) => (
    <Typography
      component="em"
      variant="bodyMedium"
      sx={{ display: 'inline', fontStyle: 'italic' }}
      {...props}
    />
  ),
};

export default bannerMarkdownComponents;
