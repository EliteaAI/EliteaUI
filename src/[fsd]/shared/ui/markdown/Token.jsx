import { memo, useCallback, useMemo } from 'react';

import { MuiMarkdown, getOverrides } from 'mui-markdown';

import { Box } from '@mui/material';

import {
  MarkdownMapping,
  extractFirstHTMLTag,
  isValidHTMLTag,
  removeHTMLTags,
} from '@/[fsd]/shared/lib/utils';
import CodeBlock from '@/components/CodeBlock';
import MarkdownTableBlock from '@/components/MarkdownTableBlock';
import { useTheme } from '@emotion/react';

import DefaultMarkdown from './DefaultMarkdown';

const Token = memo(props => {
  const {
    markedToken,
    renderHtml,
    interaction_uuid,
    conversation_uuid,
    onEdit,
    selectedCodeBlockInfo,
    tableId,
    canvasId,
    messageItemId,
    isStreaming,
    showToolbar = true,
    spokenRange,
  } = props;

  const theme = useTheme();
  const styles = getStyles();

  const overrides = useCallback(
    rawData => ({
      ...getOverrides(),
      ...MarkdownMapping,
      div: {
        component: Box,
        props: {
          component: 'div',
        },
      },
      table: {
        component: MarkdownTableBlock,
        props: {
          tableRowData: rawData,
          interaction_uuid,
          conversation_uuid,
          onEdit,
          startPos: markedToken.startPos,
          endPos: markedToken.endPos,
          selectedCodeBlockInfo,
          tableId,
          canvasId,
          messageItemId,
          isStreaming,
          showToolbar,
        },
      },
    }),
    [
      interaction_uuid,
      conversation_uuid,
      onEdit,
      markedToken.startPos,
      markedToken.endPos,
      selectedCodeBlockInfo,
      tableId,
      canvasId,
      messageItemId,
      isStreaming,
      showToolbar,
    ],
  );

  // Stamp sequential startPos values onto an array of tokens starting from basePos.
  const stampChildren = useCallback((tokens, basePos) => {
    let pos = basePos;
    return tokens.map(token => {
      const stamped = { ...token, startPos: pos };
      pos += token.raw.length;
      return stamped;
    });
  }, []);

  // Map already-stamped tokens to <Token> elements.
  const mapToTokens = useCallback(
    tokens =>
      tokens.map((token, idx) => (
        <Token
          markedToken={token}
          key={idx}
          renderHtml={renderHtml}
          spokenRange={spokenRange}
        />
      )),
    [renderHtml, spokenRange],
  );

  // Find where inner content begins inside markedToken.raw by locating the first sub-token's raw.
  // This skips leading delimiters (**, *, #•space, bullet+space, etc.).
  const innerBase = useCallback(
    tokens => {
      const firstRaw = tokens?.[0]?.raw ?? '';
      const offset = firstRaw ? markedToken.raw.indexOf(firstRaw) : 0;
      return (markedToken.startPos ?? 0) + (offset >= 0 ? offset : 0);
    },
    [markedToken.startPos, markedToken.raw],
  );

  const fallback = useMemo(
    () => (
      <DefaultMarkdown
        markedToken={markedToken}
        overrides={overrides}
      />
    ),
    [markedToken, overrides],
  );

  if (markedToken.type == 'html' && !renderHtml) {
    markedToken.type = 'text';
    markedToken.raw = removeHTMLTags(markedToken.raw);
    markedToken.text = removeHTMLTags(markedToken.text);
  }

  switch (markedToken.type) {
    case 'code': {
      if (markedToken.lang) {
        return (
          <CodeBlock
            theme={theme}
            markedToken={markedToken}
            onEdit={onEdit}
            startPos={markedToken.startPos}
            endPos={markedToken.endPos}
            selectedCodeBlockInfo={selectedCodeBlockInfo}
            canvasId={canvasId}
            messageItemId={messageItemId}
            isStreaming={isStreaming}
            showToolbar={showToolbar}
          />
        );
      }
      return (
        <MuiMarkdown options={{ disableParsingRawHTML: true, overrides: overrides(markedToken.raw) }}>
          {markedToken.raw}
        </MuiMarkdown>
      );
    }
    case 'text': {
      // Text token wrapping inline sub-tokens (e.g. from list items) — recurse like paragraph.
      if (markedToken.tokens?.some(t => t.type !== 'text')) {
        return (
          <Box
            component="span"
            sx={styles.text}
          >
            {mapToTokens(stampChildren(markedToken.tokens, markedToken.startPos ?? 0))}
          </Box>
        );
      }
      if (spokenRange && markedToken.startPos !== undefined) {
        const ts = markedToken.startPos;
        const overlapStart = Math.max(spokenRange.start, ts);
        const overlapEnd = Math.min(spokenRange.end, ts + markedToken.raw.length);
        if (overlapStart < overlapEnd) {
          return (
            <Box
              component="span"
              sx={styles.text}
            >
              {markedToken.raw.slice(0, overlapStart - ts)}
              <Box
                component="mark"
                sx={styles.mark}
              >
                {markedToken.raw.slice(overlapStart - ts, overlapEnd - ts)}
              </Box>
              {markedToken.raw.slice(overlapEnd - ts)}
            </Box>
          );
        }
      }
      return (
        <Box
          component="span"
          sx={styles.text}
        >
          {markedToken.raw}
        </Box>
      );
    }
    case 'br':
      return <Box component="br" />;
    case 'table':
      if (!markedToken.rows?.length) {
        return (
          <MarkdownTableBlock
            tableRowData={markedToken.raw}
            interaction_uuid={interaction_uuid}
            conversation_uuid={conversation_uuid}
            onEdit={onEdit}
            startPos={markedToken.startPos}
            endPos={markedToken.endPos}
            selectedCodeBlockInfo={selectedCodeBlockInfo}
            tableId={tableId}
            canvasId={canvasId}
            messageItemId={messageItemId}
            isStreaming={isStreaming}
            showToolbar={showToolbar}
          />
        );
      }
      return fallback;
    case 'html': {
      try {
        const isValidHtml = isValidHTMLTag(extractFirstHTMLTag(markedToken.raw)?.slice(1, -1));
        return (
          <MuiMarkdown
            options={{ disableParsingRawHTML: !isValidHtml, overrides: overrides(markedToken.raw) }}
          >
            {markedToken.raw}
          </MuiMarkdown>
        );
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('render html markdown error: ', error);
        return (
          <MuiMarkdown options={{ disableParsingRawHTML: true, overrides: overrides(markedToken.raw) }}>
            {markedToken.raw}
          </MuiMarkdown>
        );
      }
    }
    case 'paragraph': {
      try {
        if (markedToken.tokens?.length) {
          return (
            <Box
              component="p"
              sx={styles.paragraph}
            >
              {mapToTokens(stampChildren(markedToken.tokens, markedToken.startPos ?? 0))}
            </Box>
          );
        }
        return <MuiMarkdown overrides={overrides(markedToken.raw)}>{markedToken.raw}</MuiMarkdown>;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('render paragraph markdown error: ', error);
        return (
          <MuiMarkdown options={{ disableParsingRawHTML: true, overrides: overrides(markedToken.raw) }}>
            {markedToken.raw}
          </MuiMarkdown>
        );
      }
    }
    case 'em':
    case 'strong':
    case 'strong_em': {
      if (markedToken.tokens?.length) {
        const children = mapToTokens(stampChildren(markedToken.tokens, innerBase(markedToken.tokens)));
        if (markedToken.type === 'strong_em') {
          return (
            <Box
              component="strong"
              sx={styles.inline}
            >
              <Box
                component="em"
                sx={styles.inline}
              >
                {children}
              </Box>
            </Box>
          );
        }
        return (
          <Box
            component={markedToken.type === 'strong' ? 'strong' : 'em'}
            sx={styles.inline}
          >
            {children}
          </Box>
        );
      }
      return fallback;
    }
    case 'list': {
      if (markedToken.items?.length) {
        const stampedItems = stampChildren(
          markedToken.items.map(item => ({ ...item, type: 'list_item' })),
          markedToken.startPos ?? 0,
        );
        return <Box component={markedToken.ordered ? 'ol' : 'ul'}>{mapToTokens(stampedItems)}</Box>;
      }
      return fallback;
    }
    case 'list_item': {
      if (markedToken.tokens?.length) {
        return (
          <Box component="li">
            {mapToTokens(stampChildren(markedToken.tokens, innerBase(markedToken.tokens)))}
          </Box>
        );
      }
      return fallback;
    }
    case 'heading': {
      if (markedToken.tokens?.length) {
        return (
          <Box component={`h${markedToken.depth}`}>
            {mapToTokens(stampChildren(markedToken.tokens, innerBase(markedToken.tokens)))}
          </Box>
        );
      }
      return fallback;
    }
    case 'blockquote': {
      if (markedToken.tokens?.length) {
        return (
          <Box component="blockquote">
            {mapToTokens(stampChildren(markedToken.tokens, innerBase(markedToken.tokens)))}
          </Box>
        );
      }
      return fallback;
    }
    default:
      return fallback;
  }
});

Token.displayName = 'Token';

/**@type {MuiSx} */
const getStyles = () => ({
  text: { whiteSpace: 'pre-wrap' },
  paragraph: {
    marginBlockStart: '0rem',
    marginBottom: '0.8em',
    whiteSpace: 'pre-wrap',
  },
  mark: { background: 'transparent', color: 'white', fontWeight: 500 },
  inline: { display: 'inline' },
});

export default Token;
