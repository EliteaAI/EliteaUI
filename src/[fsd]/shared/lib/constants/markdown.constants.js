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
