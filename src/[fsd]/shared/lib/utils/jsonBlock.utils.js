import { format } from 'jsonc-parser';

/**
 * Rendering a JSON payload inside a chat message.
 *
 * Markdown collapses the line breaks and interprets * _ ` and links that appear
 * inside values, so a JSON answer has to be fenced to survive intact.
 */
const jsonBlock = text => '```json\n' + text + '\n```';

const FORMAT_OPTIONS = { tabSize: 2, insertSpaces: true, eol: '\n' };

/**
 * Indent JSON by reformatting its text, never by re-serializing it.
 *
 * JSON.parse + JSON.stringify would round an id past 2^53 (BigQuery INT64, ADO
 * work item ids), drop duplicate keys and turn 1e400 into null -- showing the
 * user a wrong value. jsonc-parser edits the source text, so every literal
 * survives exactly as the tool produced it.
 */
const indentJsonText = text => {
  // format() returns one edit per token, ascending and non-overlapping, so they
  // can be applied in a single pass. jsonc-parser's own applyEdits rebuilds the
  // whole string per edit, which is quadratic: 436KB of tool output measured at
  // 1507ms against 2ms here, and this runs synchronously during render.
  const edits = format(text, undefined, FORMAT_OPTIONS);
  const parts = [];
  let consumed = 0;
  edits.forEach(edit => {
    parts.push(text.slice(consumed, edit.offset), edit.content);
    consumed = edit.offset + edit.length;
  });
  parts.push(text.slice(consumed));
  return parts.join('');
};

/**
 * Render a complete JSON payload as a fenced block, or return it untouched.
 *
 * Markdown eats line breaks and interprets * _ ` and links inside values, so a
 * JSON answer has to be fenced to survive. Only call this where the text is
 * COMPLETE: fencing a streamed fragment splices fences into the middle of a
 * message.
 */
export const formatJsonBlock = content => {
  // JSON.stringify(undefined) returns the VALUE undefined rather than throwing,
  // so without this a missing payload renders as a fenced literal "undefined"
  // and every `|| ''` guard at the call sites is dead (the fence is truthy).
  if (content === null || content === undefined) {
    return '';
  }
  if (typeof content !== 'string') {
    try {
      return jsonBlock(JSON.stringify(content, null, 2));
    } catch {
      return '' + content;
    }
  }
  const trimmed = content.trim();
  if (trimmed.startsWith('```') || (!trimmed.startsWith('{') && !trimmed.startsWith('['))) {
    return content;
  }
  // Cheap reject before the parse: a growing payload has no closing bracket yet.
  if (!trimmed.endsWith('}') && !trimmed.endsWith(']')) {
    return content;
  }
  let parsed;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return content;
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return content;
  }
  return jsonBlock(indentJsonText(trimmed));
};
