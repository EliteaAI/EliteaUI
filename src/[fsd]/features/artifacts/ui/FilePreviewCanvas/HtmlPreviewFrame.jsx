import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import createDOMPurify from 'dompurify';

import { Box, Typography, useTheme } from '@mui/material';

import { Modal } from '@/[fsd]/shared/ui';

const purifyInstance = createDOMPurify(window);

// Prevent premature </script> tag closure when handler code is embedded in a <script> block.
// The browser HTML parser is not JS-aware: seeing </script> inside a script body ends the block.
const escapeScriptClose = str => str.replace(/<\/script/gi, '<\\/script');

const INLINE_EVENT_ATTRS = new Set([
  'onclick',
  'ondblclick',
  'onmousedown',
  'onmouseup',
  'onmouseover',
  'onmouseout',
  'onmousemove',
  'onmouseenter',
  'onmouseleave',
  'onkeydown',
  'onkeyup',
  'onkeypress',
  'onchange',
  'oninput',
  'onfocus',
  'onblur',
  'onselect',
  'onsubmit',
  'onreset',
  'onscroll',
  'onwheel',
  'ondrag',
  'ondragstart',
  'ondragend',
  'ondragover',
  'ondragenter',
  'ondragleave',
  'ondrop',
  'onpointerdown',
  'onpointerup',
  'onpointermove',
  'onpointerover',
  'onpointerout',
  'ontouchstart',
  'ontouchend',
  'ontouchmove',
  'oncontextmenu',
  'oncopy',
  'oncut',
  'onpaste',
  'onload',
  'onerror',
]);

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

const buildFallbackStyles = ({ textColor, backgroundColor, themeMode }) =>
  `<style id="elitea-html-preview-theme">
    :root { color-scheme: ${themeMode}; }
    html, body {
      color: ${textColor};
      background-color: ${backgroundColor};
    }
  </style>`;

// DOMPurify parses input via innerHTML which applies the HTML tokenizer — not the raw-text
// model the HTML5 spec requires for <script> bodies. Sequences like `<letter`, `</`, and
// `<!--` inside a script body confuse the tokenizer and silently drop the whole block.
// Fix: extract inline script bodies to a side-table before sanitization, replace them with
// safe placeholders, sanitize the structure, then restore bodies afterward.
// DOMPurify does not sanitize script body text content anyway (only element attributes),
// so this bypasses nothing — the security boundary remains the nonce-based CSP and sandbox.
const SCRIPT_BODY_RE = /(<script(?:\s[^>]*)?>)([\s\S]*?)(<\/script>)/gi;

const HTML_COMMENT_RE = /<!--[\s\S]*?-->/g;

const extractScriptBodies = html => {
  // Mask HTML comments first so a literal `<script>` inside a comment does not
  // fool SCRIPT_BODY_RE into starting an extraction in the wrong place.
  const commentSlots = [];
  const masked = html.replace(HTML_COMMENT_RE, m => {
    const idx = commentSlots.length;
    commentSlots.push(m);
    return `<!--__ELITEA_COMMENT_${idx}__-->`;
  });

  const bodies = [];
  const maskedStripped = masked.replace(SCRIPT_BODY_RE, (_, open, body, close) => {
    const idx = bodies.length;
    // Restore any comment placeholders that landed inside this script body.
    bodies.push(body.replace(/<!--__ELITEA_COMMENT_(\d+)__-->/g, (_not_used, i) => commentSlots[Number(i)]));
    return `${open}/* __ELITEA_SCRIPT_BODY_${idx}__ */${close}`;
  });

  // Restore comment placeholders remaining outside script bodies.
  const stripped = maskedStripped.replace(
    /<!--__ELITEA_COMMENT_(\d+)__-->/g,
    (_, i) => commentSlots[Number(i)],
  );

  return { stripped, bodies };
};

const restoreScriptBodies = (html, bodies) =>
  html.replace(/\/\* __ELITEA_SCRIPT_BODY_(\d+)__ \*\//g, (_, idx) => bodies[Number(idx)] ?? '');

const sanitizeForPreview = (rawHtml, nonce, hostOrigin, fallbackStyles) => {
  const { stripped, bodies } = extractScriptBodies(rawHtml);

  const capturedHandlers = [];
  const nodePids = new WeakMap();
  let pidCounter = 0;

  purifyInstance.addHook('uponSanitizeAttribute', (node, data) => {
    if (!INLINE_EVENT_ATTRS.has(data.attrName)) return;
    if (!nodePids.has(node)) {
      nodePids.set(node, `ep${pidCounter++}`);
    }
    capturedHandlers.push({
      pid: nodePids.get(node),
      eventName: data.attrName.slice(2),
      code: data.attrValue,
    });
    data.keepAttr = false;
  });

  purifyInstance.addHook('afterSanitizeAttributes', node => {
    if (node.tagName === 'A' || node.tagName === 'AREA') {
      const href = node.getAttribute('href');
      if (href) node.setAttribute('data-original-href', href);
      node.setAttribute('href', '#');
      node.removeAttribute('target');
      node.removeAttribute('xlink:href');
    }
    // Stamp inline scripts with the per-render nonce so CSP allows them.
    // External scripts (with src) intentionally receive no nonce — CSP blocks them.
    if (node.tagName === 'SCRIPT' && !node.hasAttribute('src')) {
      node.setAttribute('nonce', nonce);
    }
    if (nodePids.has(node)) {
      node.setAttribute('data-elitea-pid', nodePids.get(node));
    }
  });

  let cleanStripped;
  let blockedExternalScripts = 0;
  let blockedEmbeds = 0;

  try {
    cleanStripped = purifyInstance.sanitize(stripped, {
      WHOLE_DOCUMENT: true,
      FORCE_BODY: false,
      FORBID_ATTR: ['target'],
      ADD_TAGS: ['script'],
      ADD_ATTR: ['nonce', 'data-elitea-pid'],
    });

    blockedExternalScripts = purifyInstance.removed.filter(
      entry => entry.element?.tagName === 'SCRIPT' && entry.element?.hasAttribute('src'),
    ).length;

    blockedEmbeds = purifyInstance.removed.filter(entry =>
      ['IFRAME', 'OBJECT', 'EMBED'].includes(entry.element?.tagName),
    ).length;
  } finally {
    purifyInstance.removeHook('uponSanitizeAttribute');
    purifyInstance.removeHook('afterSanitizeAttributes');
  }

  if (!cleanStripped) return null;

  // Restore original script bodies. escapeScriptClose is applied so restored content
  // cannot prematurely close the <script> tag in the final HTML string.
  // If DOMPurify removed a <script> element entirely (e.g. external src), its placeholder
  // is also gone from cleanStripped, so restoreScriptBodies finds nothing to replace — correct.
  const clean = restoreScriptBodies(
    cleanStripped,
    bodies.map(b => escapeScriptClose(b)),
  );

  let handlerScript = '';
  if (capturedHandlers.length > 0) {
    const wirings = capturedHandlers
      .map(
        ({ pid, eventName, code }) =>
          `(function(){` +
          `var el=document.querySelector('[data-elitea-pid="${pid}"]');` +
          `if(el)el.addEventListener('${eventName}',function(event){${escapeScriptClose(code)}}.bind(el));` +
          `})();`,
      )
      .join('\n');
    handlerScript =
      `<script nonce="${nonce}">` +
      `document.addEventListener('DOMContentLoaded',function(){\n${wirings}\n});` +
      `</script>`;
  }

  const warnings = [];
  if (blockedExternalScripts > 0) {
    warnings.push(
      `${blockedExternalScripts} external script${blockedExternalScripts > 1 ? 's' : ''} blocked — ` +
        `external <script src="..."> tags are not supported in preview.`,
    );
  }
  if (blockedEmbeds > 0) {
    warnings.push(
      `${blockedEmbeds} embedded element${blockedEmbeds > 1 ? 's' : ''} removed — ` +
        `<iframe>, <object>, and <embed> are not supported in preview.`,
    );
  }

  const injection =
    `<meta http-equiv="Content-Security-Policy" content="${buildPreviewCsp(nonce)}">` +
    fallbackStyles +
    buildLinkInterceptScript(nonce, hostOrigin) +
    handlerScript;

  let finalHtml;
  if (/<head([^>]*)>/i.test(clean)) {
    finalHtml = clean.replace(/<head([^>]*)>/i, `<head$1>${injection}`);
  } else if (/<html([^>]*)>/i.test(clean)) {
    finalHtml = clean.replace(/<html([^>]*)>/i, `<html$1><head>${injection}</head>`);
  } else {
    finalHtml = `<head>${injection}</head>${clean}`;
  }

  return { html: finalHtml, warnings };
};

const HtmlPreviewFrame = memo(props => {
  const { htmlContent } = props;
  const iframeRef = useRef(null);
  const [clickedUrl, setClickedUrl] = useState(null);
  const theme = useTheme();
  const styles = htmlPreviewFrameStyles();

  const nonce = useMemo(() => window.crypto.randomUUID().replace(/-/g, ''), []);
  const hostOrigin = useMemo(() => window.location.origin, []);
  const fallbackStyles = useMemo(
    () =>
      buildFallbackStyles({
        textColor: theme.palette.text.primary,
        backgroundColor: theme.palette.background.default,
        themeMode: theme.palette.mode,
      }),
    [theme.palette.text.primary, theme.palette.background.default, theme.palette.mode],
  );

  const sanitizeResult = useMemo(() => {
    if (!htmlContent || !htmlContent.trim()) return { empty: true };

    try {
      const result = sanitizeForPreview(htmlContent, nonce, hostOrigin, fallbackStyles);
      if (!result?.html) return { error: true };
      return result;
    } catch {
      return { error: true };
    }
  }, [htmlContent, nonce, hostOrigin, fallbackStyles]);

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
      {sanitizeResult.warnings?.length > 0 && (
        <Box sx={styles.warningBanner}>
          {sanitizeResult.warnings.map((msg, i) => (
            <Typography
              key={i}
              variant="bodySmall"
              sx={styles.warningText}
            >
              {msg}
            </Typography>
          ))}
        </Box>
      )}
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
  warningBanner: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    padding: '0.5rem 1rem',
    backgroundColor: palette.warning.background ?? palette.background.secondary,
    borderBottom: `0.0625rem solid ${palette.warning.main}`,
    flexShrink: 0,
  }),
  warningText: ({ palette }) => ({
    color: palette.warning.dark ?? palette.text.secondary,
  }),
});

export default HtmlPreviewFrame;
