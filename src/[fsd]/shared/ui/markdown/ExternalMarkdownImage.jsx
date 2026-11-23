import { memo, useCallback } from 'react';

import { Link } from '@mui/material';

// A span-based link so it can sit inside the page's own anchors; the image itself is never fetched.
const ExternalMarkdownImage = memo(props => {
  const { src, alt, title } = props;
  const label = `[Image: ${alt || title || 'image'}]`;

  const open = useCallback(
    event => {
      event.preventDefault();
      event.stopPropagation();
      window.open(src, '_blank', 'noopener,noreferrer');
    },
    [src],
  );

  const onKeyDown = useCallback(
    event => {
      if (event.key === 'Enter' || event.key === ' ') open(event);
    },
    [open],
  );

  if (!src || !/^https?:\/\//i.test(src)) return <Link component="span">{label}</Link>;

  return (
    <Link
      component="span"
      role="link"
      tabIndex={0}
      title={src}
      onClick={open}
      onKeyDown={onKeyDown}
      sx={styles.link}
    >
      {label}
    </Link>
  );
});

ExternalMarkdownImage.displayName = 'ExternalMarkdownImage';

/** @type {MuiSx} */
const styles = { link: { cursor: 'pointer' } };

export default ExternalMarkdownImage;
