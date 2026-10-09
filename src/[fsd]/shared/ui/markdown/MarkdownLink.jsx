import { memo } from 'react';

import { Link } from '@mui/material';

import { resolveArtifactHref } from '@/[fsd]/shared/lib/helpers/link.helpers';

const MarkdownLink = memo(props => {
  const { href, children, sx, ...restProps } = props;

  const styles = markdownLinkStyles();

  return (
    <Link
      href={resolveArtifactHref(href)}
      sx={[styles.root, ...(Array.isArray(sx) ? sx : [sx])]}
      {...restProps}
    >
      {children}
    </Link>
  );
});

MarkdownLink.displayName = 'MarkdownLink';

/** @type {MuiSx} */
const markdownLinkStyles = () => ({
  root: {
    // Inline code inside link text (e.g. [Download `file.html`](...)) should read as part of the link,
    // not as a separate chip. `!important` is required to beat mui-markdown's inline code styles.
    '& code': {
      backgroundColor: 'transparent !important',
      padding: '0 !important',
      color: 'inherit',
    },
  },
});

export default MarkdownLink;
