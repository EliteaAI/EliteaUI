import React, { memo, useMemo } from 'react';

import DOMPurify from 'dompurify';

import { Box, Typography } from '@mui/material';

// Blocks all external resource loading inside the iframe.
// sandbox="" already prevents scripts and same-origin access; this CSP adds
// defense-in-depth against tracking pixels, external CSS, and data exfiltration
// via image URL parameters.
const PREVIEW_CSP = [
  "default-src 'none'",
  "style-src 'unsafe-inline'",
  'img-src data: blob:',
  "script-src 'none'",
  "connect-src 'none'",
  "font-src 'none'",
  "frame-src 'none'",
  "object-src 'none'",
].join('; ');

const CSP_META_TAG = `<meta http-equiv="Content-Security-Policy" content="${PREVIEW_CSP}">`;

const sanitizeForPreview = rawHtml => {
  // WHOLE_DOCUMENT preserves <html>/<head>/<body> structure of full HTML files.
  const clean = DOMPurify.sanitize(rawHtml, {
    WHOLE_DOCUMENT: true,
    FORCE_BODY: false,
  });

  if (!clean) return null;

  // DOMPurify with WHOLE_DOCUMENT always produces a <head> tag; inject CSP there.
  const withCsp = clean.replace(/<head([^>]*)>/i, `<head$1>${CSP_META_TAG}`);

  return withCsp;
};

const HtmlPreviewFrame = memo(props => {
  const { htmlContent } = props;

  const styles = htmlPreviewFrameStyles();

  const sanitizeResult = useMemo(() => {
    if (!htmlContent || !htmlContent.trim()) return { empty: true };

    try {
      const html = sanitizeForPreview(htmlContent);
      if (!html) return { error: true };
      return { html };
    } catch {
      return { error: true };
    }
  }, [htmlContent]);

  if (sanitizeResult.empty) {
    return (
      <Box sx={styles.fallbackWrapper}>
        <Typography
          variant="bodyMedium"
          sx={styles.fallbackTitle}
        >
          No content to display
        </Typography>
        <Typography
          variant="bodySmall"
          sx={styles.fallbackDescription}
        >
          The HTML file appears to be empty.
        </Typography>
      </Box>
    );
  }

  if (sanitizeResult.error) {
    return (
      <Box sx={styles.fallbackWrapper}>
        <Typography
          variant="bodyMedium"
          sx={styles.fallbackTitle}
        >
          Preview unavailable
        </Typography>
        <Typography
          variant="bodySmall"
          sx={styles.fallbackDescription}
        >
          The file could not be rendered safely. Switch to Raw mode to inspect the source.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={styles.wrapper}>
      <iframe
        srcDoc={sanitizeResult.html}
        sandbox=""
        title="HTML Preview"
        referrerPolicy="no-referrer"
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
      />
    </Box>
  );
});

HtmlPreviewFrame.displayName = 'HtmlPreviewFrame';

/** @type {MuiSx} */
const htmlPreviewFrameStyles = () => ({
  wrapper: ({ palette }) => ({
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: palette.background.secondary,
    height: '100%',
  }),

  fallbackWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    textAlign: 'center',
    padding: '1.5rem',
  },

  fallbackTitle: ({ palette }) => ({
    color: palette.text.secondary,
    marginBottom: '0.5rem',
  }),

  fallbackDescription: ({ palette }) => ({
    color: palette.text.tertiary,
  }),
});

export default HtmlPreviewFrame;
