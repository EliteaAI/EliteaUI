import { useMemo } from 'react';

/**
 * Computes highlight ranges for committed slash mentions within the current input text.
 *
 * Returns an array of {start, end} character positions (sorted, non-overlapping)
 * for every committed mention token found in the input.
 *
 * Longer tokens are checked first so that `/toolkit/tool` shadows `/toolkit`
 * when both appear at the same position.
 *
 * @param {string} inputContent - current text in the chat input
 * @param {Array}  committedMentions - from useSlashCommandHandler; each entry
 *                 must have { toolkit_name, tool_name }
 * @returns {Array<{start: number, end: number}>}
 */
export const useSlashHighlights = (inputContent, committedMentions) =>
  useMemo(() => {
    if (!committedMentions?.length || !inputContent) return [];

    // Build unique token strings; sort longest-first to prevent sub-match shadowing.
    const tokens = [
      ...new Set(
        committedMentions.map(m =>
          m.tool_name ? `/${m.toolkit_name}/${m.tool_name}` : `/${m.toolkit_name}`,
        ),
      ),
    ].sort((a, b) => b.length - a.length);

    const ranges = [];

    for (const token of tokens) {
      let idx = inputContent.indexOf(token);
      while (idx !== -1) {
        const end = idx + token.length;
        // Skip if this range overlaps any already-recorded range.
        if (!ranges.some(r => idx < r.end && end > r.start)) {
          ranges.push({ start: idx, end });
        }
        idx = inputContent.indexOf(token, idx + 1);
      }
    }

    return ranges.sort((a, b) => a.start - b.start);
  }, [inputContent, committedMentions]);
