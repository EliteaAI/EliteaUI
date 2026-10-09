import { memo, useMemo } from 'react';

import { buildSharedAttachment } from '@/[fsd]/pages/shared-conversation/lib/helpers';
import MessageAttachmentList from '@/components/Chat/MessageAttachmentList';

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
