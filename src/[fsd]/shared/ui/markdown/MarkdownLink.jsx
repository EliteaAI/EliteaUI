import { memo } from 'react';

import { Box, Link } from '@mui/material';

import { useArtifactLinkResolver } from '@/[fsd]/shared/lib/context/ArtifactLinkContext';
import { resolveArtifactHref } from '@/[fsd]/shared/lib/helpers/link.helpers';

const MarkdownLink = memo(props => {
  const { href, children, sx, ...restProps } = props;

  const resolveArtifact = useArtifactLinkResolver();
  const resolvedHref = resolveArtifactHref(href, resolveArtifact);

  const styles = markdownLinkStyles();

  // Artifact file that can't be opened in this context (e.g. not part of a shared chat) — show plain text
  if (resolvedHref === null) return <Box component="span">{children}</Box>;

  return (
    <Link
      href={resolvedHref}
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
