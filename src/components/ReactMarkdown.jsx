/* eslint-disable no-unused-vars */
import { useCallback } from 'react';

import { marked } from 'marked';
import { Highlight, themes } from 'prism-react-renderer';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {
  Box,
  ListItem,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  ThemeProvider,
  Typography,
} from '@mui/material';
import Link from '@mui/material/Link';

import Tooltip from '@/ComponentsLib/Tooltip';
import useAlitaTheme from '@/hooks/useAlitaTheme';
import useToast from '@/hooks/useToast';
import { useTheme } from '@emotion/react';

import { StyledDiv } from './Markdown';
import MarkdownTableBlock from './MarkdownTableBlock';
import MermaidCodeBlock from './MermaidCodeBlock';

const MarkdownMapping = {
  h1: ({ node, ...props }) => (
    <Typography
      component="div"
      variant="headingMedium"
      {...props}
    />
  ),
  h2: ({ node, ...props }) => (
    <Typography
      component="div"
      variant="headingSmall"
      {...props}
    />
  ),
  h3: ({ node, ...props }) => (
    <Typography
      component="div"
      variant="labelMedium"
      {...props}
    />
  ),
  h4: ({ node, ...props }) => (
    <Typography
      component="div"
      variant="labelSmall"
      {...props}
    />
  ),
  h5: ({ node, ...props }) => (
    <Typography
      component="div"
      variant="bodyMedium"
      {...props}
    />
  ),
  h6: ({ node, ...props }) => (
    <Typography
      component="div"
      variant="bodyMedium"
      {...props}
    />
  ),
  p: ({ node, ...props }) => (
    <p
      style={{ marginBlockStart: '0px' }}
      {...props}
    />
  ),
  span: ({ node, ...props }) => <span {...props} />,
  a: ({ node, ...props }) => (
    <Link
      target="_blank"
      variant="bodySmall"
      {...props}
    />
  ),
  ol: ({ node, ...props }) => (
    <ol
      style={{
        paddingLeft: '24px',
        margin: '8px 0',
        listStyleType: 'decimal',
        listStylePosition: 'outside',
      }}
      {...props}
    />
  ),
  ul: ({ node, ...props }) => (
    <ul
      style={{
        paddingLeft: '24px',
        margin: '8px 0',
        listStyleType: 'disc',
        listStylePosition: 'outside',
      }}
      {...props}
    />
  ),
  li: ({ node, ...props }) => (
    <li
      style={{
        whiteSpaceCollapse: 'preserve',
        display: 'list-item',
        listStylePosition: 'outside',
        paddingLeft: '4px',
        marginBottom: '4px',
      }}
      {...props}
    />
  ),
  img: ({ src, alt, ...props }) => {
    if (!src || !/^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\//.test(src)) return null;
    return (
      <img
        src={src}
        alt={alt}
        {...props}
      />
    );
  },
};

const Token = ({ markedToken, renderHtml, interaction_uuid }) => {
  const theme = useTheme();
  const { toastInfo } = useToast();
  const onCopyToEditor = useCallback(
    code => async () => {
      await navigator.clipboard.writeText(code);
      toastInfo('The code has been copied into clipboard');
    },
    [toastInfo],
  );

  switch (markedToken.type) {
    case 'code': {
      if (markedToken.lang) {
        if (markedToken.lang === 'mermaid') {
          return (
            <MermaidCodeBlock
              markedToken={markedToken}
              theme={theme}
            />
          );
        }
        return (
          <Highlight
            theme={theme.palette.mode === 'dark' ? themes.vsDark : themes.oneLight}
            code={markedToken.text}
            language={markedToken.lang}
          >
            {({ className, style = {}, tokens, getLineProps, getTokenProps }) => (
              <pre
                className={className}
                style={{ ...style, overflow: 'hidden', paddingRight: '8px', paddingBottom: '8px' }}
              >
                <Box
                  sx={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    padding: '8px 0px 8px 8px',
                  }}
                >
                  <Tooltip title="Copy code">
                    <Box
                      onClick={onCopyToEditor(markedToken.text)}
                      sx={{
                        height: '24px',
                        width: '24px',
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <ContentCopyIcon sx={{ fontSize: '16px', color: theme.palette.icon.fill.primary }} />
                    </Box>
                  </Tooltip>
                </Box>
                <Box sx={{ width: '100%', overflowX: 'scroll' }}>
                  {tokens.map((line, i) => (
                    <div
                      key={i}
                      {...getLineProps({ line })}
                    >
                      <span> </span>
                      {line.map((token, key) => (
                        <span
                          key={key}
                          {...getTokenProps({ token })}
                        />
                      ))}
                    </div>
                  ))}
                </Box>
              </pre>
            )}
          </Highlight>
        );
      } else {
        return (
          <Markdown
            remarkPlugins={[remarkGfm]}
            components={MarkdownMapping}
          >
            {markedToken.raw}
          </Markdown>
        );
      }
    }

    default:
      try {
        return (
          <Markdown
            remarkPlugins={[remarkGfm]}
            components={{
              ...MarkdownMapping,
              div: ({ node, ...props }) => <StyledDiv {...props} />,
              table: ({ node, ...props }) => (
                <MarkdownTableBlock
                  tableRowData={markedToken.raw}
                  interaction_uuid={interaction_uuid}
                  {...props}
                />
              ),
              thead: ({ node, ...props }) => <TableHead {...props} />,
              tbody: ({ node, ...props }) => <TableBody {...props} />,
              tr: ({ node, ...props }) => <TableRow {...props} />,
              th: ({ node, ...props }) => <TableCell {...props} />,
              td: ({ node, ...props }) => <TableCell {...props} />,
            }}
          >
            {markedToken.raw}
          </Markdown>
        );
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('render default markdown error: ', error);
        return markedToken.raw;
      }
  }
};

const ReactMarkdown = ({ children, renderHtml = true, interaction_uuid }) => {
  const { localGridTheme } = useAlitaTheme();
  let markedTokens;
  try {
    markedTokens = marked.lexer(children || '');
  } catch (error) {
    markedTokens = [
      {
        type: 'text',
        raw: 'there is some wild unparsable thing and only backend can see it',
        text: 'there is some wild unparsable thing and only backend can see it',
      },
    ];
  }
  return (
    <ThemeProvider theme={localGridTheme}>
      {markedTokens.map((markedToken, index) => (
        <Token
          markedToken={markedToken}
          key={index}
          renderHtml={renderHtml}
          interaction_uuid={interaction_uuid}
        />
      ))}
    </ThemeProvider>
  );
};

export default ReactMarkdown;
