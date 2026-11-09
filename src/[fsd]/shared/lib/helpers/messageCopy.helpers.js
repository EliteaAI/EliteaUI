import DOMPurify from 'dompurify';
import { Marked } from 'marked';

import { formatJsonBlock } from '@/[fsd]/shared/lib/utils/jsonBlock.utils';
import { ROLES } from '@/common/constants';

// Same flavour the chat preview renders with: GFM, and single newlines shown as
// line breaks (the preview uses white-space: pre-wrap). A private instance keeps
// these options off the global `marked` used by the Markdown component.
const markdownParser = new Marked({ gfm: true, breaks: true });

const PLAIN_TEXT_RULE = '────────────';
const UNORDERED_LIST_MARKER = '• ';
const QUOTE_INDENT = '    ';

const SANITIZE_OPTIONS = {
  FORBID_TAGS: ['style', 'script', 'input', 'button', 'form', 'select', 'textarea', 'iframe'],
  FORBID_ATTR: ['style', 'class', 'id'],
};

const LINE_BREAK_TAG = /^<br\s*\/?>$/i;

const toTextContent = html => {
  if (!html || typeof DOMParser === 'undefined') return '';
  return new DOMParser().parseFromString(DOMPurify.sanitize(html), 'text/html').body.textContent || '';
};

// Text tokens keep entities exactly as typed (`&amp;`), while the preview shows
// the decoded character, so decode them; code is left untouched. A textarea decodes
// entities only: it keeps whitespace and never reads `<b` as the start of a tag.
const decodeEntities = value => {
  if (!value || !value.includes('&') || typeof document === 'undefined') return value || '';
  const textarea = document.createElement('textarea');
  textarea.innerHTML = value;
  return textarea.value;
};

// An inline `<br>` has no text of its own: it ends the line, or, in a table cell,
// separates the parts with a space so the row stays on one line
const inlineHtmlToText = (html, lineBreak) =>
  LINE_BREAK_TAG.test(html.trim()) ? lineBreak : toTextContent(html);

const indentLines = (text, indent, firstLineIndent = indent) =>
  text
    .split('\n')
    .map((line, index) => (index === 0 ? firstLineIndent : line ? indent : '') + line)
    .join('\n');

// `lineBreak` is what a line break becomes: a newline, or a space inside a table cell
const inlineToText = (tokens = [], lineBreak = '\n') =>
  tokens
    .map(token => {
      switch (token.type) {
        case 'text':
          return token.tokens?.length ? inlineToText(token.tokens, lineBreak) : decodeEntities(token.text);
        case 'strong':
        case 'em':
        case 'del':
          return inlineToText(token.tokens, lineBreak);
        case 'codespan':
          return token.text;
        case 'escape':
          return token.text;
        case 'br':
          return lineBreak;
        case 'link': {
          const label = inlineToText(token.tokens, lineBreak);
          return token.href && token.href !== label ? `${label} (${token.href})` : label;
        }
        case 'image':
          return token.text || '';
        case 'html':
          return inlineHtmlToText(token.text, lineBreak);
        default:
          return token.tokens?.length
            ? inlineToText(token.tokens, lineBreak)
            : decodeEntities(token.text || '');
      }
    })
    .join('');

const listToText = token => {
  const start = Number(token.start) || 1;
  return token.items
    .map((item, index) => {
      const marker = token.ordered ? `${start + index}. ` : UNORDERED_LIST_MARKER;
      const taskPrefix = item.task ? (item.checked ? '[x] ' : '[ ] ') : '';
      // A tight list keeps its nested blocks on consecutive lines
      const body = blocksToText(item.tokens, item.loose ? '\n\n' : '\n');
      return indentLines(taskPrefix + body, ' '.repeat(marker.length), marker);
    })
    .join(token.loose ? '\n\n' : '\n');
};

// A line break inside a cell becomes a space, so each table row stays on one line
const cellToText = cell => inlineToText(cell.tokens, ' ');

const tableToText = token => {
  const header = token.header.map(cellToText).join('\t');
  const rows = token.rows.map(row => row.map(cellToText).join('\t'));
  return [header, ...rows].join('\n');
};

const blockToText = token => {
  switch (token.type) {
    case 'space':
    case 'def':
      return null;
    case 'heading':
    case 'paragraph':
      return inlineToText(token.tokens);
    case 'text':
      return token.tokens?.length ? inlineToText(token.tokens) : decodeEntities(token.text);
    case 'code':
      return token.text;
    case 'blockquote':
      return indentLines(blocksToText(token.tokens), QUOTE_INDENT);
    case 'list':
      return listToText(token);
    case 'table':
      return tableToText(token);
    case 'hr':
      return PLAIN_TEXT_RULE;
    case 'html':
      return toTextContent(token.text).trim();
    default:
      return token.tokens?.length ? inlineToText(token.tokens) : token.text || '';
  }
};

const blocksToText = (tokens = [], separator = '\n\n') =>
  tokens
    .map(blockToText)
    .filter(part => part !== null && part !== '')
    .join(separator);

/**
 * Readable plain text of a Markdown document: no heading `#`, emphasis `**` or
 * code fences, but list structure, table rows/columns and code kept verbatim.
 * Walks the parsed tokens instead of stripping characters, so literal `*`, `#`
 * or backticks inside code survive.
 */
export const markdownToPlainText = markdown => {
  if (!markdown) return '';
  try {
    return blocksToText(markdownParser.lexer(markdown)).trim();
  } catch {
    return markdown;
  }
};

/** Sanitized HTML of a Markdown document, without styles, scripts or controls. */
export const markdownToHtml = markdown => {
  if (!markdown) return '';
  try {
    return DOMPurify.sanitize(markdownParser.parse(markdown), SANITIZE_OPTIONS);
  } catch {
    return '';
  }
};

const escapeHtml = text =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Errors render monospace in the chat, so they paste as a preformatted block
const preformattedToHtml = text => `<pre>${escapeHtml(text)}</pre>`;

const stringifyContent = content => {
  if (content === null || content === undefined) return '';
  if (typeof content === 'string') return content;
  try {
    return JSON.stringify(content, null, 2);
  } catch {
    return String(content);
  }
};

const canvasToRendered = item => {
  const content = stringifyContent(item.item_details?.latest_version?.canvas_content);
  const language = item.item_details?.latest_version?.code_language;
  // The preview shows a code canvas as a code block, so its text must not be parsed as Markdown
  if (item.item_details?.canvas_type === 'code' && language && language !== 'markdown') {
    return '```' + language + '\n' + content + '\n```';
  }
  return content;
};

const itemToCopyPart = item => {
  switch (item.item_type) {
    case 'attachment_message':
      return null;
    case 'canvas_message': {
      const source = stringifyContent(item.item_details?.latest_version?.canvas_content);
      return source ? { source, rendered: canvasToRendered(item) } : null;
    }
    default: {
      const source = stringifyContent(item.item_details?.content ?? item.content);
      return source ? { source, rendered: formatJsonBlock(source) } : null;
    }
  }
};

/**
 * What a chat message's copy actions put on the clipboard.
 *
 * `markdown` is the untouched source (for "Copy markdown"); `rendered` is the
 * Markdown the preview actually renders (JSON answers fenced, code canvases as
 * code blocks), which "Copy text" converts. Exceptions and user input are not
 * rendered as Markdown, so they are copied as they are.
 *
 * @returns {{ markdown: string, rendered: string, isMarkdown: boolean, isPreformatted: boolean }}
 */
export const getChatMessageCopySource = message => {
  if (!message) return { markdown: '', rendered: '', isMarkdown: false, isPreformatted: false };

  if (message.exception) {
    const exception = stringifyContent(message.exception);
    return { markdown: exception, rendered: exception, isMarkdown: false, isPreformatted: true };
  }

  const isUserMessage = message.role === ROLES.User;
  const items = message.message_items || [];
  const textItems = isUserMessage ? items.filter(item => item.item_type === 'text_message') : items;
  const parts = textItems.map(itemToCopyPart).filter(Boolean);

  if (!parts.length) {
    const content = stringifyContent(message.content);
    return {
      markdown: content,
      rendered: isUserMessage ? content : formatJsonBlock(content),
      isMarkdown: !isUserMessage,
      isPreformatted: false,
    };
  }

  const markdown = parts.map(part => part.source).join('\n\n');
  return {
    markdown,
    // User input is shown as typed, so it is copied as typed: no JSON fences or reindent
    rendered: isUserMessage ? markdown : parts.map(part => part.rendered).join('\n\n'),
    isMarkdown: !isUserMessage,
    isPreformatted: false,
  };
};

/**
 * Clipboard payload for "Copy text": rich HTML plus readable plain text.
 * @returns {{ html: string, text: string }}
 */
export const buildCopyTextPayload = ({ rendered, isMarkdown, isPreformatted }) => {
  if (isPreformatted) return { html: preformattedToHtml(rendered), text: rendered };
  // Plain-text input (user messages) has no formatting to carry over
  if (!isMarkdown) return { html: '', text: rendered };
  return { html: markdownToHtml(rendered), text: markdownToPlainText(rendered) };
};

/**
 * Write both `text/html` and `text/plain`; fall back to plain text where rich
 * clipboard writes are unavailable or refused. Rejects when nothing was written.
 */
export const writeRichTextToClipboard = async ({ html, text }) => {
  if (html && typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([text], { type: 'text/plain' }),
        }),
      ]);
      return;
    } catch {
      // Fall through to the plain-text write below
    }
  }
  await navigator.clipboard.writeText(text);
};
