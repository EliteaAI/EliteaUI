import React, { useMemo } from 'react';

import { Box } from '@mui/material';

import { ChatAttachment } from '@/[fsd]/features/chat/ui';
import { isImageFile } from '@/common/utils';

import NormalAttachment from './NormalAttachment';

const MessageAttachmentList = props => {
  const { items = [], onRemoveAttachment } = props;

  const { imagesItems, otherFilesItems } = useMemo(() => {
    return items.reduce(
      (acc, file) => {
        if (isImageFile(file)) {
          acc.imagesItems.push(file);
        } else {
          acc.otherFilesItems.push(file);
        }
        return acc;
      },
      { imagesItems: [], otherFilesItems: [] },
    );
  }, [items]);

  if (!items?.length) {
    return null;
  }
  return (
    <Box
      sx={{
        width: '100%',
        marginTop: '0.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}
    >
      {imagesItems.length > 0 && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, 16.25rem)',
            justifyContent: 'center',
            gap: '0.5rem',
            marginTop: imagesItems.length > 0 ? '0.5rem' : '0px',
          }}
        >
          {imagesItems.map((file, index) => (
            <ChatAttachment.ImageAttachment
              key={file.uuid || 'file_' + index}
              attachment={file}
              onRemoveAttachment={onRemoveAttachment}
            />
          ))}
        </Box>
      )}

      {otherFilesItems.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            gap: '0.5rem',
            width: '100%',
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginTop: '0.5rem',
          }}
        >
          {otherFilesItems.map((file, index) => (
            <NormalAttachment
              key={file.uuid || 'file_' + index}
              attachment={file}
              onRemoveAttachment={onRemoveAttachment}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default MessageAttachmentList;
