/**
 * Parses a stored notification message into renderable segments.
 * Link syntax: [visible text](href)
 *
 * @param {string} message
 * @returns {Array<{text: string, href?: string}>}
 */
export const parseMessage = message => {
  if (!message) return [];
  const segments = [];
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match;
  while ((match = linkRegex.exec(message)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: message.slice(lastIndex, match.index) });
    }
    segments.push({ text: match[1], href: match[2] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < message.length) {
    segments.push({ text: message.slice(lastIndex) });
  }
  return segments.length > 0 ? segments : [{ text: message }];
};
