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

// ─── Inline token → speakable text ───────────────────────────────────────────

/**
 * Extract speakable plain text from an array of inline tokens.
 *
 * - codespan  : read content (drop backticks)
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
          return token.text ?? '';
        default:
          return stripEmoji(token.text ?? token.raw ?? '');
      }
    })
    .join('');
};

/**
 * Like inlineText but also builds fine-grained segments so each text run maps
 * precisely to its position in the original markdown.
 *
 * origBase    — absolute start position of these tokens in the original markdown
 * strippedBase — absolute start position of these tokens in the stripped text
 *
 * Returns { text: string, segments: Segment[] }
 * where Segment = { origStart, origLen, strippedStart, strippedLen }
 *
 * Segments for leaf text tokens have a 1:1 char mapping (modulo emoji
 * stripping which is rare mid-word), so translateSpokenPos works correctly.
 */
const inlineTextSegments = (tokens, origBase, strippedBase) => {
  if (!tokens?.length) return { text: '', segments: [] };

  let origOffset = 0;
  let strippedOffset = 0;
  const segments = [];
  const parts = [];

  for (const token of tokens) {
    const tokenOrigStart = origBase + origOffset;

    switch (token.type) {
      case 'text': {
        if (token.tokens?.length) {
          // text token wrapping sub-tokens — recurse at same origBase; no extra delimiter
          const inner = inlineTextSegments(token.tokens, tokenOrigStart, strippedBase + strippedOffset);
          segments.push(...inner.segments);
          parts.push(inner.text);
          strippedOffset += inner.text.length;
        } else {
          const piece = stripEmoji(token.text ?? token.raw ?? '');
          if (piece) {
            segments.push({
              origStart: tokenOrigStart,
              origLen: token.raw.length,
              strippedStart: strippedBase + strippedOffset,
              strippedLen: piece.length,
            });
            parts.push(piece);
            strippedOffset += piece.length;
          }
        }
        origOffset += token.raw.length;
        break;
      }

      case 'em':
      case 'strong':
      case 'strong_em': {
        // Skip the opening delimiter (* / ** / ***) so inner content maps 1:1
        const delimLen = token.type === 'strong_em' ? 3 : token.type === 'strong' ? 2 : 1;
        const innerTokens = token.tokens ?? [];
        const inner = inlineTextSegments(
          innerTokens,
          tokenOrigStart + delimLen,
          strippedBase + strippedOffset,
        );
        segments.push(...inner.segments);
        parts.push(inner.text);
        strippedOffset += inner.text.length;
        origOffset += token.raw.length;
        break;
      }

      case 'link': {
        const href = token.href ?? '';
        const linkTokens = token.tokens ?? [];
        const textFromTokens = inlineText(linkTokens);
        if (isUrl(href)) {
          const piece =
            !textFromTokens || textFromTokens === href || isUrl(textFromTokens) ? 'the link' : textFromTokens;
          segments.push({
            origStart: tokenOrigStart,
            origLen: token.raw.length,
            strippedStart: strippedBase + strippedOffset,
            strippedLen: piece.length,
          });
          parts.push(piece);
          strippedOffset += piece.length;
        } else if (isFilePath(href)) {
          const piece = !textFromTokens || textFromTokens === href ? 'the file path' : textFromTokens;
          segments.push({
            origStart: tokenOrigStart,
            origLen: token.raw.length,
            strippedStart: strippedBase + strippedOffset,
            strippedLen: piece.length,
          });
          parts.push(piece);
          strippedOffset += piece.length;
        } else {
          // Descriptive link — fine-grained segments for the display text (starts after '[')
          const inner = inlineTextSegments(linkTokens, tokenOrigStart + 1, strippedBase + strippedOffset);
          segments.push(...inner.segments);
          parts.push(inner.text);
          strippedOffset += inner.text.length;
        }
        origOffset += token.raw.length;
        break;
      }

      case 'image': {
        const alt = stripEmoji(token.text ?? '').trim();
        const piece = alt ? `an image showing ${alt}` : '';
        if (piece) {
          segments.push({
            origStart: tokenOrigStart,
            origLen: token.raw.length,
            strippedStart: strippedBase + strippedOffset,
            strippedLen: piece.length,
          });
          parts.push(piece);
          strippedOffset += piece.length;
        }
        origOffset += token.raw.length;
        break;
      }

      case 'codespan': {
        const piece = token.text ?? '';
        if (piece) {
          segments.push({
            origStart: tokenOrigStart,
            origLen: token.raw.length,
            strippedStart: strippedBase + strippedOffset,
            strippedLen: piece.length,
          });
          parts.push(piece);
          strippedOffset += piece.length;
        }
        origOffset += token.raw.length;
        break;
      }

      case 'escape': {
        const piece = token.text ?? '';
        if (piece) {
          segments.push({
            origStart: tokenOrigStart,
            origLen: token.raw.length,
            strippedStart: strippedBase + strippedOffset,
            strippedLen: piece.length,
          });
          parts.push(piece);
          strippedOffset += piece.length;
        }
        origOffset += token.raw.length;
        break;
      }

      case 'br': {
        segments.push({
          origStart: tokenOrigStart,
          origLen: token.raw.length,
          strippedStart: strippedBase + strippedOffset,
          strippedLen: 1,
        });
        parts.push('\n');
        strippedOffset += 1;
        origOffset += token.raw.length;
        break;
      }

      default: {
        const piece = stripEmoji(token.text ?? token.raw ?? '');
        if (piece) {
          segments.push({
            origStart: tokenOrigStart,
            origLen: token.raw.length,
            strippedStart: strippedBase + strippedOffset,
            strippedLen: piece.length,
          });
          parts.push(piece);
          strippedOffset += piece.length;
        }
        origOffset += token.raw.length;
        break;
      }
    }
  }

  return { text: parts.join(''), segments };
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

// ─── List segment tracking ───────────────────────────────────────────────────

/**
 * Build per-item segments for a list token so translateSpokenPos can highlight
 * each list item individually as TTS reads through it.
 *
 * Returns { text: string, segments: Segment[] }
 */
const listSegments = (listToken, tokenOrigStart, strippedBase) => {
  const items = listToken.items;
  const itemTexts = [];
  const segments = [];
  let itemOrigStart = tokenOrigStart;
  let strippedOffset = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const prefix = listToken.ordered ? `${ORDINALS[i] ?? `Item ${i + 1}`}, ` : '';
    const itemContent = blockText(item.tokens).trim();
    const itemText = prefix + itemContent;

    segments.push({
      origStart: itemOrigStart,
      origLen: item.raw.length,
      strippedStart: strippedBase + strippedOffset,
      strippedLen: itemText.length,
    });

    itemTexts.push(itemText);
    // each item is followed by ". " (separator) or ".\n" (terminator) — both 2 chars
    strippedOffset += itemText.length + 2;
    itemOrigStart += item.raw.length;
  }

  return { text: itemTexts.join('. ') + '.\n', segments };
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

      if (token.type === 'paragraph' || token.type === 'heading') {
        // Fine-grained inline segments: one segment per leaf text run so
        // translateSpokenPos gives word-level accuracy for highlight.
        const { text: inlineResult, segments: inlineSegs } = inlineTextSegments(
          token.tokens ?? [],
          tokenOrigStart,
          strippedPos,
        );
        if (inlineResult) {
          segments.push(...inlineSegs);
          const piece = inlineResult + '\n';
          strippedPos += piece.length;
          parts.push(piece);
        }
      } else if (token.type === 'list') {
        // Per-item segments so each list item is highlighted individually.
        const { text: listResult, segments: listSegs } = listSegments(token, tokenOrigStart, strippedPos);
        if (listResult) {
          segments.push(...listSegs);
          strippedPos += listResult.length;
          parts.push(listResult);
        }
      } else {
        // Coarse segment for code blocks, tables, blockquotes, etc.
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
