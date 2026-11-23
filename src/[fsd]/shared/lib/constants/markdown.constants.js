// Tags that can execute code, inject styles, or load external resources.
// svg/math are included because both namespaces have their own XSS vectors
// (e.g. <svg onload=...>, <math> namespace confusion attacks).
// DOMPurify's default config already strips all on* event attributes and
// javascript:/data: URLs — no FORBID_ATTR needed.
export const FORBIDDEN_HTML_TAGS = [
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'link',
  'meta',
  'base',
  'noscript',
  'svg',
  'math',
];

// Extra restrictions inside UntrustedMarkdownBoundary: nothing may trigger a remote fetch.
export const UNTRUSTED_FORBIDDEN_HTML_TAGS = ['img', 'picture', 'source', 'video', 'audio', 'track', 'input'];
export const UNTRUSTED_FORBIDDEN_HTML_ATTRS = ['style', 'srcset', 'poster', 'background'];

export const MARKDOWN_IMAGE_MODE = { RENDER: 'render', EXTERNAL_LINK: 'external' };

export const MARKDOWN_VIEW_MODES = {
  edit: 'edit',
  preview: 'preview',
};
