import { memo } from 'react';

import { ArtifactLinkContext } from '@/[fsd]/shared/lib/context/ArtifactLinkContext';
import {
  MARKDOWN_IMAGE_MODE,
  MarkdownImageModeContext,
} from '@/[fsd]/shared/lib/context/MarkdownImageModeContext';

// Web content has no artifact paths: relative links stay plain text, images become links.
const noArtifactLinks = () => null;

const UntrustedMarkdownBoundary = memo(props => {
  const { children, enabled = true } = props;
  if (!enabled) return children;

  return (
    <ArtifactLinkContext.Provider value={noArtifactLinks}>
      <MarkdownImageModeContext.Provider value={MARKDOWN_IMAGE_MODE.EXTERNAL_LINK}>
        {children}
      </MarkdownImageModeContext.Provider>
    </ArtifactLinkContext.Provider>
  );
});

UntrustedMarkdownBoundary.displayName = 'UntrustedMarkdownBoundary';

export default UntrustedMarkdownBoundary;
