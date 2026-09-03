import { memo } from 'react';

import { Box } from '@mui/material';

import { ChatAttachment } from '@/[fsd]/features/chat/ui';
import NormalAttachment from '@/components/Chat/NormalAttachment';

const AnswerAttachments = memo(props => {
  const {
    imageAttachments,
    normalAttachments,
    hasNonAttachmentItems,
    onRemoveAttachment,
    onOpenArtifactPreview,
  } = props;

  if (!imageAttachments.length && !normalAttachments.length) return null;

  const styles = answerAttachmentsStyles(hasNonAttachmentItems, imageAttachments.length);

  return (
    <Box sx={styles.container}>
      {imageAttachments.length > 0 && (
        <Box sx={styles.imageGrid}>
          {imageAttachments.map(item => (
            <ChatAttachment.ImageAttachment
              key={item.uuid}
              attachment={item}
              onRemoveAttachment={onRemoveAttachment}
            />
          ))}
        </Box>
      )}
      {normalAttachments.length > 0 && (
        <Box
          sx={styles.normalRow}
          data-testid="chat-artifact-file-list"
        >
          {normalAttachments.map(item => (
            <NormalAttachment
              preview={!!onOpenArtifactPreview}
              key={item.uuid}
              attachment={item}
              onRemoveAttachment={onRemoveAttachment}
              onOpenArtifactPreview={onOpenArtifactPreview}
            />
          ))}
        </Box>
      )}
    </Box>
  );
});

AnswerAttachments.displayName = 'AnswerAttachments';

/** @type {MuiSx} */
const answerAttachmentsStyles = (hasNonAttachmentItems, imageCount) => ({
  container: {
    width: '100%',
    marginTop: hasNonAttachmentItems ? '0.5rem' : '0',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  imageGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, 16.25rem)',
    justifyContent: 'center',
    gap: '0.5rem',
  },
  normalRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: '0.5rem',
    width: '100%',
    flexWrap: 'wrap',
    marginTop: imageCount > 0 ? '0.5rem' : '0',
  },
});

export default AnswerAttachments;
