import { useMemo } from 'react';

export const useMentionDetection = (text, users = [], nameField = 'name', options = {}) => {
  const { allowPartialMatches = false, caseSensitive = false, minMatchLength = 1 } = options;

  // Parse mentions from text
  const mentions = useMemo(() => {
    if (!text || !users.length) return [];

    const matches = [];

    // Sort users by name length (longest first) to prioritize longer names
    const sortedUsers = [...users].sort((a, b) => (b[nameField]?.length || 0) - (a[nameField]?.length || 0));

    // Find all @ symbols
    const atSymbolRegex = /@/g;
    let atMatch;

    while ((atMatch = atSymbolRegex.exec(text)) !== null) {
      const startPos = atMatch.index;
      const remainingText = text.slice(startPos + 1);

      let bestMatch = null;
      let longestMatchLength = 0;

      // Try to match each user starting from this position
      for (const user of sortedUsers) {
        const userName = user[nameField];
        if (!userName) continue;

        const userNameToCheck = caseSensitive ? userName : userName.toLowerCase();
        const remainingTextToCheck = caseSensitive ? remainingText : remainingText.toLowerCase();

        if (allowPartialMatches) {
          // For partial matches, check if remaining text starts with user name
          if (remainingTextToCheck.startsWith(userNameToCheck) && userName.length > longestMatchLength) {
            bestMatch = {
              user,
              matchedText: userName,
              length: userName.length,
            };
            longestMatchLength = userName.length;
          }
        } else {
          // For exact matches, check if user name matches at this position
          // and is followed by word boundary (space, punctuation, or end of string)
          if (remainingTextToCheck.startsWith(userNameToCheck)) {
            const endPos = userName.length;
            const charAfterMatch = remainingText[endPos];

            // Check if this is a complete word (followed by space, punctuation, or end)
            if (!charAfterMatch || /[\s.,!?;:\n]/.test(charAfterMatch)) {
              if (userName.length > longestMatchLength) {
                bestMatch = {
                  user,
                  matchedText: remainingText.slice(0, endPos),
                  length: userName.length,
                };
                longestMatchLength = userName.length;
              }
            }
          }
        }
      }

      // If no exact match found but we allow partial matches,
      // try to find the longest possible partial match
      if (!bestMatch && allowPartialMatches) {
        // Extract potential mention text (until space, punctuation, or special chars)
        const potentialMatch = remainingText.match(/^([^@\n.,!?;:\s]*(?:\s+[^@\n.,!?;:\s]+)*)/);
        const potentialMention = potentialMatch ? potentialMatch[1].trim() : '';

        if (potentialMention.length >= minMatchLength) {
          // Find users that start with this potential mention
          const partialUser = sortedUsers.find(user => {
            const userName = user[nameField];
            if (!userName) return false;

            return caseSensitive
              ? userName.startsWith(potentialMention)
              : userName.toLowerCase().startsWith(potentialMention.toLowerCase());
          });

          if (partialUser) {
            bestMatch = {
              user: partialUser,
              matchedText: potentialMention,
              length: potentialMention.length,
              isPartial: true,
            };
          }
        }
      }

      // Add the best match if found
      if (bestMatch && bestMatch.length >= minMatchLength) {
        const mentionText = `@${bestMatch.matchedText}`;

        // Check for overlapping matches
        const isOverlapping = matches.some(
          existingMatch =>
            startPos < existingMatch.end && startPos + mentionText.length > existingMatch.start,
        );

        if (!isOverlapping) {
          matches.push({
            text: mentionText,
            username: bestMatch.matchedText,
            user: bestMatch.user,
            start: startPos,
            end: startPos + mentionText.length,
            isValid: !bestMatch.isPartial,
            isPartial: bestMatch.isPartial || false,
          });
        }
      }
    }

    return matches.sort((a, b) => a.start - b.start);
  }, [nameField, text, users, allowPartialMatches, caseSensitive, minMatchLength]);

  // Parse text into segments (text + mentions)
  const textSegments = useMemo(() => {
    if (!text) return [];
    if (!mentions.length) return [{ type: 'text', content: text }];

    const segments = [];
    let lastIndex = 0;

    mentions.forEach(mention => {
      // Add text before mention
      if (mention.start > lastIndex) {
        segments.push({
          type: 'text',
          content: text.slice(lastIndex, mention.start),
        });
      }

      // Add mention
      segments.push({
        type: 'mention',
        content: mention.text,
        user: mention.user,
        isValid: mention.isValid,
        isPartial: mention.isPartial,
      });

      lastIndex = mention.end;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      segments.push({
        type: 'text',
        content: text.slice(lastIndex),
      });
    }

    return segments.filter(segment => segment.content);
  }, [text, mentions]);

  return {
    mentions,
    textSegments,
    hasMentions: mentions.length > 0,
  };
};
