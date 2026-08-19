import { memo } from 'react';

import { Box } from '@mui/material';

import Markdown from '@/[fsd]/shared/ui/markdown';

const MessageItemRenderer = memo(props => {
  const { item } = props;

  const styles = messageItemRendererStyles();

  if (item.type === 'text_message') {
    return (
      <Box sx={styles.textContent}>
        <Markdown>{item.content}</Markdown>
      </Box>
    );
  }

  if (item.type === 'canvas_message') {
    return (
      <Box sx={styles.canvasBox}>
        <Box sx={styles.textContent}>
          <Markdown>{item.content}</Markdown>
        </Box>
      </Box>
    );
  }

  // attachment_message items are rendered separately via GroupAttachmentList
  return null;
});

MessageItemRenderer.displayName = 'MessageItemRenderer';

/** @type {MuiSx} */
const messageItemRendererStyles = () => ({
  textContent: {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  canvasBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
});

export default MessageItemRenderer;
