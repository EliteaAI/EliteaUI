import { useCallback } from 'react';

import useToast from '@/hooks/useToast';

/**
 * Hook to provide copy-to-clipboard functionality for chat messages.
 * Extracts content from different message formats (exception, message_items, content)
 * and copies to clipboard with toast notifications.
 *
 * @param {Array} chatHistory - Array of chat messages
 * @returns {Function} onCopyToClipboard - Curried function that takes message id and returns async copy handler
 *
 * @example
 * const onCopyToClipboard = useChatCopyToClipboard(chatHistory);
 * <ChatMessageList onCopyToClipboard={onCopyToClipboard} ... />
 */
const useChatCopyToClipboard = chatHistory => {
  const { toastInfo, toastError } = useToast();

  const onCopyToClipboard = useCallback(
    id => async () => {
      const message = chatHistory?.find(item => item.id === id);

      if (message) {
        try {
          let contentToCopy = '';

          if (message.exception) {
            contentToCopy = JSON.stringify(message.exception);
          } else if (message.message_items?.length) {
            contentToCopy = message.message_items
              .map(item => item.content || item.item_details?.content || '')
              .filter(Boolean)
              .join('\n');
          } else {
            contentToCopy = message.content || '';
          }

          await navigator.clipboard.writeText(contentToCopy);
          toastInfo('Copied to clipboard');
        } catch {
          toastError('Failed to copy to clipboard');
        }
      }
    },
    [chatHistory, toastInfo, toastError],
  );

  return onCopyToClipboard;
};

export default useChatCopyToClipboard;
