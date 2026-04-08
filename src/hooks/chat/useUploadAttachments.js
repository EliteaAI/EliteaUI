import { useCallback, useState } from 'react';

import { v4 as uuidv4 } from 'uuid';

import { useTrackEvent } from '@/GA';
import { GA_EVENT_NAMES, GA_EVENT_PARAMS } from '@/[fsd]/shared/lib/constants/analytic.constants';
import { DEFAULT_ATTACHMENT_BUCKET } from '@/[fsd]/shared/lib/constants/internalTools.constants';
import { useContextExecutionEntity } from '@/[fsd]/shared/lib/hooks';
import { buildErrorMessage } from '@/common/utils';
import { useUploadWithProgress } from '@/hooks/chat/useUploadWithProgress';
import { getAttachmentContentType, getAttachmentType } from '@/utils/attachmentImageUtils';

import { useSelectedProjectId } from '../useSelectedProject';
import useToast from '../useToast';

export default function useUploadAttachments() {
  const { toastError } = useToast();
  const selectedProjectId = useSelectedProjectId();
  const trackEvent = useTrackEvent();
  const { uploadWithProgress, uploadProgress, isUploading } = useUploadWithProgress();

  const [uploadingAttachments, setUploadingAttachments] = useState([]);
  const { contextExecutionEntity } = useContextExecutionEntity();

  const uploadAttachments = useCallback(
    async ({ attachments, conversationId, messages }) => {
      if (attachments?.length) {
        try {
          setUploadingAttachments(attachments);
          const result = await uploadWithProgress({
            projectId: selectedProjectId,
            attachments,
            conversationId,
          });

          // Get sanitized filenames from upload response
          const uploadedAttachments = result.data || [];

          // Create updated attachment list with sanitized names and filepath
          const updatedAttachments = attachments.map((item, idx) => {
            const uploadedInfo = uploadedAttachments[idx] || {};
            // Backend now returns filepath in format /{bucket}/{filename}
            const filepath = uploadedInfo.filepath;
            // Extract sanitized name from filepath if available, otherwise use original name
            const sanitizedName = filepath ? filepath.split('/').pop() : uploadedInfo.name || item.name;

            // Create new File object with sanitized name and store filepath
            let updatedFile;
            if (sanitizedName !== item.name) {
              updatedFile = new File([item], sanitizedName, { type: item.type });
            } else {
              updatedFile = item;
            }

            // Store filepath on the file object for later use in predict payload
            if (filepath) {
              updatedFile.filepath = filepath;
            }

            return updatedFile;
          });

          messages = messages.map((msg, index) => {
            if (!index) {
              return {
                ...msg,
                message_items: [
                  ...msg.message_items,
                  ...attachments.map((item, idx) => {
                    const attachmentType = getAttachmentType(item);
                    const contentType = getAttachmentContentType(item);
                    // Use filepath from upload response (format: /{bucket}/{filename})
                    const uploadedInfo = uploadedAttachments[idx] || {};
                    const filepath = uploadedInfo.filepath;
                    // Extract sanitized name from filepath if available
                    const sanitizedName = filepath
                      ? filepath.split('/').pop()
                      : uploadedInfo.name || item.name || 'unknown';

                    return {
                      id: new Date().getTime(),
                      uuid: uuidv4(),
                      meta: {},
                      order_index: msg.message_items.length + idx,
                      item_type: 'attachment_message',
                      item_details: {
                        bucket: DEFAULT_ATTACHMENT_BUCKET,
                        name: sanitizedName,
                        filepath, // Store filepath from backend for predict payload
                        file_size: uploadedInfo.file_size || item.size,
                        attachment_type: attachmentType,
                        content: {
                          type: contentType,
                          ...(attachmentType === 'image'
                            ? {
                                image_url: {
                                  url: URL.createObjectURL(item),
                                },
                              }
                            : {}),
                        },
                        id: new Date().getTime(),
                        item_type: 'attachment_message',
                      },
                    };
                  }),
                ],
              };
            }
            return msg;
          });

          setUploadingAttachments([]);

          attachments.forEach(attachment => {
            trackEvent(GA_EVENT_NAMES.ATTACHMENT_UPLOADED, {
              [GA_EVENT_PARAMS.ATTACHMENT_TYPE]: attachment.type.toLowerCase() || 'uknown',
              [GA_EVENT_PARAMS.UPLOAD_SOURCE]: contextExecutionEntity,
              [GA_EVENT_PARAMS.TIMESTAMP]: new Date().toISOString().split('T')[0],
            });
          });

          return {
            success: true,
            messages,
            updatedAttachments, // Return sanitized attachment list
          };
        } catch (error) {
          setUploadingAttachments([]);
          toastError(buildErrorMessage(error) || 'Failed to upload attachments, please try again.');
          return { success: false, messages };
        }
      }

      return {
        success: true,
        messages,
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedProjectId, toastError, uploadWithProgress],
  );

  return { uploadAttachments, uploadingAttachments, isUploading, uploadProgress };
}
