import { marked } from 'marked';

// ─── Emoji handling ───────────────────────────────────────────────────────────

// Functional emoji that carry meaning → spoken word
const EMOJI_MAP = {
  '✓': 'yes',
  '✔': 'yes',
  '☑': 'yes',
  '✅': 'yes',
  '✗': 'no',
  '✘': 'no',
  '✕': 'no',
  '❌': 'no',
  '⚠': 'warning',
  '⚠️': 'warning',
};

// Broad emoji Unicode ranges — decorative emoji are stripped silently.
// Variation selectors (\uFE0F etc.) are intentionally excluded to avoid
// the no-misleading-character-class ESLint rule; stripping the base
// code point is sufficient.
const EMOJI_RE = /[\u{1F300}-\u{1F9FF}\u{1FA00}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;

const stripEmoji = text => {
  let s = text;
  for (const [ch, word] of Object.entries(EMOJI_MAP)) {
    if (s.includes(ch)) s = s.split(ch).join(word ? ` ${word} ` : ' ');
  }
  return s.replace(EMOJI_RE, '').replace(/ {2,}/g, ' ');
};

// ─── Code / data / diagram placeholders ──────────────────────────────────────

const DIAGRAM_LANGS = new Set(['mermaid', 'plantuml', 'graphviz', 'd2', 'flowchart', 'sequence', 'svg']);
const DATA_LANGS = new Set(['json', 'xml', 'yaml', 'yml', 'toml', 'csv', 'tsv']);

const codeBlockPlaceholder = lang => {
  const l = (lang ?? '').toLowerCase().trim();
  if (DIAGRAM_LANGS.has(l)) return 'A diagram has been included. Please review it on screen.';
  if (DATA_LANGS.has(l)) return 'Structured data has been included. Please review it on screen.';
  return 'A code example has been included. Please review it on screen.';
};

// ─── Link / path detection ────────────────────────────────────────────────────

const isUrl = s => /^https?:\/\//i.test(s);
const isFilePath = s => /^[./\\]|^\w:[\\/]/.test(s);

// ─── List ordinals ────────────────────────────────────────────────────────────

const ORDINALS = ['First', 'Second', 'Third', 'Fourth', 'Fifth'];
const MAX_LIST_FULL = 5; // lists longer than this get a spoken summary

// ─── Inline token → speakable text ───────────────────────────────────────────

/**
 * Extract speakable plain text from an array of inline tokens.
 *
 * - codespan  : read content (drop backticks); long snippets → "a code example"
 * - link      : URL hrefs → "the link", file-path hrefs → "the file path",
 *               descriptive link text → keep the text
 * - image     : read alt text as "an image showing <alt>"
 * - emoji     : functional emoji → spoken word; decorative → stripped
 */
const inlineText = tokens => {
  if (!tokens?.length) return '';
  return tokens
    .map(token => {
      switch (token.type) {
        case 'text':
          return stripEmoji(token.tokens ? inlineText(token.tokens) : (token.text ?? token.raw ?? ''));
        case 'em':
        case 'strong':
        case 'strong_em':
          return inlineText(token.tokens);
        case 'link': {
          const href = token.href ?? '';
          const text = inlineText(token.tokens ?? []);
          if (isUrl(href)) {
            // Replace raw URLs; keep descriptive link text
            return !text || text === href || isUrl(text) ? 'the link' : text;
          }
          if (isFilePath(href)) {
            return !text || text === href ? 'the file path' : text;
          }
          return text || href;
        }
        case 'image': {
          const alt = stripEmoji(token.text ?? '').trim();
          return alt ? `an image showing ${alt}` : '';
        }
        case 'escape':
          return token.text ?? '';
        case 'br':
          return '\n';
        case 'codespan':
          // Short inline code → read as-is (backticks already stripped by marked).
          // Long snippets (SQL, expressions, etc.) → brief placeholder.
          return (token.text?.length ?? 0) <= 40 ? (token.text ?? '') : 'a code example';
        default:
          return stripEmoji(token.text ?? token.raw ?? '');
      }
    })
    .join('');
};

// ─── Block token → speakable text ────────────────────────────────────────────

/**
 * Extract speakable plain text from a block token array.
 *
 * - code   : categorised placeholder (code / data / diagram)
 * - table  : placeholder
 * - list   : ordered short lists get ordinal prefixes; long lists get a count summary
 * - html   : silently dropped
 */
const blockText = tokens => {
  if (!tokens?.length) return '';
  return tokens
    .map(token => {
      switch (token.type) {
        case 'paragraph':
          return inlineText(token.tokens) + '\n';
        case 'heading':
          return inlineText(token.tokens) + '\n';
        case 'text':
          return token.tokens ? inlineText(token.tokens) : stripEmoji(token.text ?? token.raw ?? '');
        case 'list': {
          const items = token.items;
          const count = items.length;
          if (count > MAX_LIST_FULL) {
            // Summarise long lists: state total, read first three
            const first3 = items
              .slice(0, 3)
              .map(item => blockText(item.tokens).trim())
              .join(', ');
            return `There are ${count} items in the list. The first three are: ${first3}.\n`;
          }
          if (token.ordered) {
            // Short ordered list → ordinal prefixes
            return (
              items
                .map((item, i) => `${ORDINALS[i] ?? `Item ${i + 1}`}, ${blockText(item.tokens).trim()}`)
                .join('. ') + '.\n'
            );
          }
          // Unordered list → items separated by a sentence pause
          return items.map(item => blockText(item.tokens).trim()).join('. ') + '.\n';
        }
        case 'list_item':
          return blockText(token.tokens);
        case 'blockquote':
          return blockText(token.tokens);
        case 'space':
          return '';
        case 'code':
          return codeBlockPlaceholder(token.lang) + '\n';
        case 'table':
          return 'A table has been included. Please review it on screen.\n';
        case 'html':
          return '';
        default:
          return token.text ?? '';
      }
    })
    .join('');
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Convert a markdown string to plain text suitable for TTS.
 *
 * Replaces code blocks, tables, diagrams, and data blocks with spoken
 * placeholders; reads inline code content, resolves links and images.
 *
 * Returns { text: string, segments: Array<{origStart, origLen, strippedStart, strippedLen}> }
 * where each segment records how a span of the original markdown maps to a span
 * of stripped text. Use translateSpokenPos() to map a position in `text` back
 * to the original markdown.
 */
export const toSpeakableText = markdown => {
  if (!markdown) return { text: '', segments: [] };
  try {
    const tokens = marked.lexer(markdown);
    const segments = [];
    let origPos = 0;
    let strippedPos = 0;
    const parts = [];

    for (const token of tokens) {
      const tokenOrigStart = origPos;
      origPos += token.raw.length;

      // `space` tokens are whitespace-only gaps between blocks — nothing to speak.
      // `html` blocks return '' from blockText; skip early to avoid empty segments.
      if (token.type === 'space' || token.type === 'html') continue;

      const piece = blockText([token]);
      if (piece) {
        segments.push({
          origStart: tokenOrigStart,
          origLen: token.raw.length,
          strippedStart: strippedPos,
          strippedLen: piece.length,
        });
        strippedPos += piece.length;
        parts.push(piece);
      }
    }

    const joined = parts.join('');
    const leadingWhitespace = joined.length - joined.trimStart().length;
    const text = joined.replace(/\n{3,}/g, '\n\n').trim();

    // Shift strippedStart values to account for the leading whitespace removed by trim()
    if (leadingWhitespace > 0) {
      for (const seg of segments) {
        seg.strippedStart = Math.max(0, seg.strippedStart - leadingWhitespace);
      }
    }

    return { text, segments };
  } catch {
    return { text: markdown, segments: [] };
  }
};

/**
 * Translate a character position in the stripped (speakable) text back to
 * the corresponding position in the original markdown string.
 *
 * @param {number} strippedPos - position in the text returned by toSpeakableText()
 * @param {Array<{origStart,origLen,strippedStart,strippedLen}>} segments
 * @returns {number} position in the original markdown
 */
export const translateSpokenPos = (strippedPos, segments) => {
  if (!segments?.length) return strippedPos;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (strippedPos <= seg.strippedStart + seg.strippedLen) {
      const offset = Math.max(0, strippedPos - seg.strippedStart);
      return seg.origStart + offset;
    }
  }

  // Beyond all segments — return end of last segment's original range
  const last = segments[segments.length - 1];
  return last.origStart + last.origLen;
};
