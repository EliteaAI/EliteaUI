import { useMemo } from 'react';

/**
 * Generic hook that computes highlight ranges for committed mentions within text.
 *
 * @param {string} inputContent - current text
 * @param {Array}  committedMentions - committed mention objects
 * @param {function} tokenBuilder - (mention) => string token to search for
 * @returns {Array<{start: number, end: number}>}
 */
export const useMentionHighlights = (inputContent, committedMentions, tokenBuilder) =>
  useMemo(() => {
    if (!committedMentions?.length || !inputContent) return [];

    // Build unique token strings; sort longest-first to prevent sub-match shadowing.
    const tokens = [...new Set(committedMentions.map(tokenBuilder))].sort((a, b) => b.length - a.length);

    const ranges = [];

    for (const token of tokens) {
      let idx = inputContent.indexOf(token);
      while (idx !== -1) {
        const end = idx + token.length;
        if (!ranges.some(r => idx < r.end && end > r.start)) {
          ranges.push({ start: idx, end });
        }
        idx = inputContent.indexOf(token, idx + 1);
      }
    }

    return ranges.sort((a, b) => a.start - b.start);
  }, [inputContent, committedMentions, tokenBuilder]);
