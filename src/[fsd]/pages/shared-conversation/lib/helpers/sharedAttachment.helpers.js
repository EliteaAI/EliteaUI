export const buildSharedAttachmentUrl = (token, groupId, fileName) =>
  `${window.location.protocol}//${window.location.host}/api/v2/elitea_core/shared_chat_attachment/prompt_lib/${token}/${groupId}/${encodeURIComponent(fileName)}`;

/**
 * Maps a shared conversation `attachment_message` item to the attachment shape used by chat attachment
 * components. Files are served by the public shared-chat endpoint, since the viewer has no access to the
 * owner's project artifact buckets.
 */
export const buildSharedAttachment = (item, token, groupId) => {
  const attachment = item.attachment;
  if (!attachment) return null;

  const rawName = attachment.name || '';
  const displayName = rawName.includes('/') ? rawName.split('/').pop() : rawName;
  const url = displayName ? buildSharedAttachmentUrl(token, groupId, displayName) : null;
  const isImage = attachment.attachment_type === 'image';

  return {
    name: displayName,
    item_details: {
      name: displayName,
      bucket: attachment.bucket,
      attachment_type: attachment.attachment_type,
      ...(isImage && url ? { content: [{ type: 'image_url', image_url: { url } }] } : { download_url: url }),
    },
  };
};
