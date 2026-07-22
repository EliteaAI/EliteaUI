import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import createDOMPurify from 'dompurify';

import { Box, Typography } from '@mui/material';

import { Modal } from '@/[fsd]/shared/ui';

const purifyInstance = createDOMPurify(window);

const buildPreviewCsp = nonce =>
  [
    "default-src 'none'",
    "style-src 'unsafe-inline'",
    'img-src data: blob:',
    `script-src 'nonce-${nonce}'`,
    "connect-src 'none'",
    "font-src 'none'",
    "frame-src 'none'",
    "object-src 'none'",
  ].join('; ');

const buildLinkInterceptScript = (nonce, targetOrigin) =>
  `<script nonce="${nonce}">
    document.addEventListener('click', function(e) {
      var a = e.target.closest('a');
      if (a) {
        e.preventDefault();
        var u = a.getAttribute('data-original-href');
        if (u) parent.postMessage({ type: 'html-preview-link', url: u }, '${targetOrigin}');
      }
    });
    document.addEventListener('submit', function(e) { e.preventDefault(); });
  </script>`;

const sanitizeForPreview = (rawHtml, nonce, hostOrigin) => {
  purifyInstance.addHook('afterSanitizeAttributes', node => {
    if (node.tagName === 'A' || node.tagName === 'AREA') {
      const href = node.getAttribute('href');
      if (href) node.setAttribute('data-original-href', href);
      node.setAttribute('href', '#');
      node.removeAttribute('target');
      node.removeAttribute('xlink:href');
    }
  });

  const clean = purifyInstance.sanitize(rawHtml, {
    WHOLE_DOCUMENT: true,
    FORCE_BODY: false,
    FORBID_ATTR: ['target'],
  });

  purifyInstance.removeHook('afterSanitizeAttributes');

  if (!clean) return null;

  const injection = `<meta http-equiv="Content-Security-Policy" content="${buildPreviewCsp(nonce)}">${buildLinkInterceptScript(nonce, hostOrigin)}`;

  if (/<head([^>]*)>/i.test(clean)) {
    return clean.replace(/<head([^>]*)>/i, `<head$1>${injection}`);
  }

  if (/<html([^>]*)>/i.test(clean)) {
    return clean.replace(/<html([^>]*)>/i, `<html$1><head>${injection}</head>`);
  }

  return `<head>${injection}</head>${clean}`;
};

const HtmlPreviewFrame = memo(props => {
  const { htmlContent } = props;
  const iframeRef = useRef(null);
  const [clickedUrl, setClickedUrl] = useState(null);

  const nonce = useMemo(() => window.crypto.randomUUID().replace(/-/g, ''), []);
  const hostOrigin = useMemo(() => window.location.origin, []);

  const sanitizeResult = useMemo(() => {
    if (!htmlContent || !htmlContent.trim()) return { empty: true };

    try {
      const html = sanitizeForPreview(htmlContent, nonce, hostOrigin);
      if (!html) return { error: true };
      return { html };
    } catch {
      return { error: true };
    }
  }, [htmlContent, nonce, hostOrigin]);

  useEffect(() => {
    const handleMessage = e => {
      if (e.origin !== hostOrigin && e.origin !== 'null') return;
      if (e.source !== iframeRef.current?.contentWindow) return;
      if (e.data?.type === 'html-preview-link' && e.data?.url) {
        setClickedUrl(e.data.url);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [hostOrigin]);

  const handleCloseDialog = useCallback(() => setClickedUrl(null), []);

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
        ref={iframeRef}
        srcDoc={sanitizeResult.html}
        sandbox="allow-scripts"
        title="HTML Preview"
        referrerPolicy="no-referrer"
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
      />
      <Modal.BaseModal
        open={!!clickedUrl}
        onClose={handleCloseDialog}
        title="External Link"
        onConfirm={handleCloseDialog}
        confirmButtonText="Close"
        content={
          <Box>
            <Typography
              variant="bodySmall"
              sx={styles.dialogDescription}
            >
              This link points to an external URL:
            </Typography>
            <Typography
              variant="bodySmall"
              sx={styles.dialogUrl}
            >
              {clickedUrl}
            </Typography>
          </Box>
        }
      />
    </Box>
  );
});

HtmlPreviewFrame.displayName = 'HtmlPreviewFrame';

const styles = {
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
  dialogDescription: ({ palette }) => ({
    color: palette.text.secondary,
    display: 'block',
    marginBottom: '0.5rem',
  }),
  dialogUrl: ({ palette }) => ({
    color: palette.text.primary,
    wordBreak: 'break-all',
    display: 'block',
    fontFamily: 'monospace',
  }),
};

export default HtmlPreviewFrame;
