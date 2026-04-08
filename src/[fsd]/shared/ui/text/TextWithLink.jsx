import { memo } from 'react';

import { Box, Link } from '@mui/material';

const TextWithLink = memo(data => (
  <Box>
    {data.text}{' '}
    <Link
      href={data.linkUrl}
      target="_blank"
      rel="noopener noreferrer"
      sx={styles.link}
    >
      {data.linkText}
    </Link>
    {data.suffix}
  </Box>
));

TextWithLink.displayName = 'TextWithLink';

const styles = {
  link: {
    color: 'inherit',
    textDecoration: 'underline',

    '&:hover': {
      cursor: 'pointer',
      textDecoration: 'underline',
    },
  },
};

export default TextWithLink;
