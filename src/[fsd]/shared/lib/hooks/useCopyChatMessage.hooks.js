import { useCallback } from 'react';

import { MessageCopyConstants } from '@/[fsd]/shared/lib/constants';
import {
  buildCopyTextPayload,
  getChatMessageCopySource,
  writeRichTextToClipboard,
} from '@/[fsd]/shared/lib/helpers/messageCopy.helpers';

import { useToast } from './useToast.hooks';

const { COPY_FORMATS, COPY_SUCCESS_MESSAGES, COPY_FAILURE_MESSAGE } = MessageCopyConstants;

/**
 * Shared "Copy markdown" / "Copy text" handler for chat messages.
 *
 * @param {Array} chatHistory - messages the ids are looked up in
 * @returns {(id: string, format?: string) => Promise<void>} copy handler; `format` defaults to markdown
 */
export const useCopyChatMessage = chatHistory => {
  const { toastInfo, toastError } = useToast();

  return useCallback(
    async (id, format = COPY_FORMATS.markdown) => {
      const message = chatHistory?.find(item => item.id === id);
      if (!message) return;

      const copySource = getChatMessageCopySource(message);
      if (!copySource.markdown) return;

      try {
        if (format === COPY_FORMATS.text) {
          await writeRichTextToClipboard(buildCopyTextPayload(copySource));
        } else {
          await navigator.clipboard.writeText(copySource.markdown);
        }
        toastInfo(COPY_SUCCESS_MESSAGES[format] || COPY_SUCCESS_MESSAGES[COPY_FORMATS.markdown]);
      } catch {
        toastError(COPY_FAILURE_MESSAGE);
      }
    },
    [chatHistory, toastInfo, toastError],
  );
};
