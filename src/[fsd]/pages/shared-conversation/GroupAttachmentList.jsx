import { memo, useMemo } from 'react';

import MessageAttachmentList from '@/components/Chat/MessageAttachmentList';

const buildSharedAttachment = (item, token, groupId) => {
  const attachment = item.attachment;
  if (!attachment) return null;

  const rawName = attachment.name || '';
  const displayName = rawName.includes('/') ? rawName.split('/').pop() : rawName;
  const url = displayName
    ? `${window.location.protocol}//${window.location.host}/api/v2/elitea_core/shared_chat_attachment/prompt_lib/${token}/${groupId}/${encodeURIComponent(displayName)}`
    : null;
  const isImage = attachment.attachment_type === 'image';

  return {
    name: displayName,
    item_details: {
      name: displayName,
      bucket: attachment.bucket,
      attachment_type: attachment.attachment_type,
      ...(isImage && url
        ? { content: [{ type: 'image_url', image_url: { url } }] }
        : { filepath: url ? `/${attachment.bucket}/${displayName}` : null }),
    },
  };
};

const GroupAttachmentList = memo(props => {
  const { items, token, groupId } = props;

  const attachments = useMemo(
    () =>
      items
        .filter(item => item.type === 'attachment_message')
        .map(item => buildSharedAttachment(item, token, groupId))
        .filter(Boolean),
    [items, token, groupId],
  );

  if (!attachments.length) return null;

  return <MessageAttachmentList items={attachments} />;
});

GroupAttachmentList.displayName = 'GroupAttachmentList';

export default GroupAttachmentList;
