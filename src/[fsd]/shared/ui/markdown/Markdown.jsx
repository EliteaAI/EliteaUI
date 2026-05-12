import { memo } from 'react';

import { marked } from 'marked';

import { Box, ThemeProvider } from '@mui/material';

import useEliteATheme from '@/hooks/useEliteATheme';

import Token from './Token';

const Markdown = memo(props => {
  const {
    children,
    renderHtml = true,
    interaction_uuid,
    conversation_uuid,
    isStreaming = false,
    onEdit,
    selectedCodeBlockInfo,
    canvasId,
    messageItemId,
    tableId,
    showToolbar,
    spokenRange,
  } = props;

  const styles = getStyles();
  const { localGridTheme } = useEliteATheme();
  let markedTokens;
  let pos = 0;
  try {
    markedTokens = marked.lexer(children || '');
  } catch {
    markedTokens = [
      {
        type: 'text',
        raw: 'there is some wild unparsable thing and only backend can see it',
        text: 'there is some wild unparsable thing and only backend can see it',
      },
    ];
  }
  markedTokens = markedTokens.map(token => {
    const startPos = pos;
    pos += token.raw.length;
    const endPos = pos;
    return {
      ...token,
      startPos,
      endPos,
    };
  });
  return (
    <ThemeProvider theme={localGridTheme}>
      <Box sx={styles.container}>
        {markedTokens.map((markedToken, index) => (
          <Token
            markedToken={markedToken}
            key={index}
            renderHtml={renderHtml}
            interaction_uuid={interaction_uuid}
            conversation_uuid={conversation_uuid}
            onEdit={onEdit}
            selectedCodeBlockInfo={selectedCodeBlockInfo}
            tableId={tableId}
            canvasId={canvasId}
            messageItemId={messageItemId}
            isStreaming={isStreaming}
            showToolbar={showToolbar}
            spokenRange={spokenRange}
          />
        ))}
      </Box>
    </ThemeProvider>
  );
});

Markdown.displayName = 'Markdown';

/**@type {MuiSx} */
const getStyles = () => ({
  container: {
    whiteSpace: 'pre-wrap',
    '& *': {
      whiteSpace: 'inherit',
    },
    '& pre, & code': {
      whiteSpace: 'pre-wrap',
    },
  },
});

export default Markdown;
