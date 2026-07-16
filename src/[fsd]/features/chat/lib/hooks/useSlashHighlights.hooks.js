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

    // committedMentions deduplicates by toolkit_id — only the last committed mention
    // per toolkit is stored. To highlight ALL occurrences of a toolkit in the text
    // (e.g. /abc-test/tool1 and /abc-test/tool2 both typed), we build a per-toolkit
    // regex that matches any /toolkitName[/toolName] pattern in the text.
    const toolkitNames = [...new Set(committedMentions.map(m => m.toolkit_name))];

    const ranges = [];

    for (const name of toolkitNames) {
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Match /toolkitName optionally followed by /toolName (non-whitespace, non-slash).
      // Negative lookahead (?!\w) prevents matching /toolkitNameExtra as /toolkitName
      // while correctly handling all valid terminators (space, punctuation, end of string).
      const re = new RegExp(`\\/${escaped}(?:\\/[^\\s/]+)?(?!\\w)`, 'g');
      let match;
      while ((match = re.exec(inputContent)) !== null) {
        const start = match.index;
        const end = start + match[0].length;
        if (!ranges.some(r => start < r.end && end > r.start)) {
          ranges.push({ start, end });
        }
      }
    }

    return ranges.sort((a, b) => a.start - b.start);
  }, [inputContent, committedMentions]);
