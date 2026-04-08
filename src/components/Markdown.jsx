import { useCallback } from 'react';

import { marked } from 'marked';
import { MuiMarkdown, getOverrides } from 'mui-markdown';

import { Box, ThemeProvider, Typography } from '@mui/material';
import Link from '@mui/material/Link';

import { typographyVariants } from '@/MainTheme';
import useEliteATheme from '@/hooks/useEliteATheme';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';

import CodeBlock from './CodeBlock';
import MarkdownTableBlock from './MarkdownTableBlock';

export const isMarkdown = content => {
  try {
    const html = marked(content);
    return html !== content; // If the parsed HTML differs from the input, it's markdown
  } catch {
    return false; // If parsing fails, it's not markdown
  }
};

function removeHTMLTags(htmlString) {
  return htmlString.replace(/<\/?[^>]+(>|$)/g, '');
}

const MarkdownMapping = {
  h1: {
    component: Typography,
    props: {
      variant: 'headingMedium',
      component: 'h1',
      sx: theme => ({
        borderBottom: `1px solid ${theme.palette.border.lines}`,
        paddingBottom: '0.4em',
        marginTop: '1.2em',
      }),
    },
  },
  h2: {
    component: Typography,
    props: {
      variant: 'headingSmall',
      component: 'h2',
      sx: theme => ({
        borderBottom: `1px solid ${theme.palette.border.lines}`,
        paddingBottom: '0.4em',
        marginTop: '1.2em',
      }),
    },
  },
  h3: {
    component: Typography,
    props: {
      variant: 'labelMedium',
      component: 'h3',
      sx: () => ({
        paddingBottom: '0.4em',
        marginTop: '1.2em',
      }),
    },
  },
  h4: {
    component: Typography,
    props: {
      variant: 'labelSmall',
      component: 'h4',
      sx: () => ({
        paddingBottom: '0.4em',
        marginTop: '1.2em',
      }),
    },
  },
  h5: {
    component: Typography,
    props: {
      variant: 'bodyMedium',
      component: 'h5',
      sx: () => ({
        paddingBottom: '0.4em',
        marginTop: '1.2em',
      }),
    },
  },
  h6: {
    component: Typography,
    props: {
      variant: 'bodyMedium',
      component: 'h6',
      sx: () => ({
        paddingBottom: '0.4em',
        marginTop: '1.2em',
      }),
    },
  },
  p: {
    component: 'p',
    props: {
      style: {
        marginBlockStart: '0px',
        marginBottom: '0.8em',
        whiteSpace: 'pre-wrap',
      },
    },
  },
  span: {
    component: 'span',
    props: {
      style: {
        whiteSpace: 'pre-wrap',
      },
    },
  },
  a: {
    component: Link,
    props: {
      target: '_blank',
      variant: 'bodySmall',
    },
  },
  ol: {
    component: 'ol',
    props: {
      style: {
        ...typographyVariants.bodyMedium,
        paddingLeft: '24px', // theme.spacing(3) equivalent
        margin: '8px 0', // theme.spacing(1, 0) equivalent
        listStyleType: 'decimal',
        listStylePosition: 'outside',
      },
    },
  },
  ul: {
    component: 'ul',
    props: {
      style: {
        ...typographyVariants.bodyMedium,
        paddingLeft: '24px', // theme.spacing(3) equivalent
        margin: '8px 0', // theme.spacing(1, 0) equivalent
        listStyleType: 'disc',
        listStylePosition: 'outside',
      },
    },
  },
  li: {
    component: 'li',
    props: {
      style: {
        ...typographyVariants.bodyMedium,
        whiteSpaceCollapse: 'preserve',
        display: 'list-item',
        listStylePosition: 'outside',
        paddingLeft: '4px', // theme.spacing(0.5) equivalent
        marginBottom: '4px', // theme.spacing(0.5) equivalent
      },
    },
  },
  strong: {
    component: 'strong',
    props: {
      style: {
        whiteSpace: 'pre-wrap',
      },
    },
  },
  br: {
    component: 'br',
    props: {},
  },
  em: {
    component: 'em',
    props: {
      style: {
        whiteSpace: 'pre-wrap',
      },
    },
  },
  img: {
    component: ({ src, alt, ...props }) => {
      if (!src || !/^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\//.test(src)) return null;
      return (
        <img
          src={src}
          alt={alt}
          {...props}
        />
      );
    },
    props: {},
  },
};

export const StyledDiv = styled('div')(
  () => `
  background: transparent;
  white-space: pre-wrap;
`,
);

const standardHtmlTags = [
  'a',
  'abbr',
  'address',
  'area',
  'article',
  'aside',
  'audio',
  'b',
  'base',
  'bdi',
  'bdo',
  'blockquote',
  'body',
  'br',
  'button',
  'canvas',
  'caption',
  'cite',
  'code',
  'col',
  'colgroup',
  'data',
  'datalist',
  'dd',
  'del',
  'details',
  'dfn',
  'dialog',
  'div',
  'dl',
  'dt',
  'em',
  'embed',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'head',
  'header',
  'hgroup',
  'hr',
  'html',
  'i',
  'iframe',
  'img',
  'input',
  'ins',
  'kbd',
  'keygen',
  'label',
  'legend',
  'li',
  'link',
  'main',
  'map',
  'mark',
  'menu',
  'menuitem',
  'meta',
  'meter',
  'nav',
  'noscript',
  'object',
  'ol',
  'optgroup',
  'option',
  'output',
  'p',
  'param',
  'picture',
  'pre',
  'progress',
  'q',
  'rp',
  'rt',
  'ruby',
  's',
  'samp',
  'script',
  'section',
  'select',
  'small',
  'source',
  'span',
  'strong',
  'style',
  'sub',
  'summary',
  'sup',
  'table',
  'tbody',
  'td',
  'textarea',
  'tfoot',
  'th',
  'thead',
  'time',
  'title',
  'tr',
  'track',
  'u',
  'ul',
  'var',
  'video',
  'wbr',
];

function isValidHTMLTag(tag) {
  return !!tag && standardHtmlTags.includes(tag.toLowerCase());
}

function extractFirstHTMLTag(str) {
  const match = str.match(/<([^>]+)>/);
  return match.length ? match[0] : null;
}

const DefaultMarkdown = ({ markedToken, overrides }) => {
  try {
    return <MuiMarkdown overrides={overrides(markedToken.raw)}>{markedToken.raw}</MuiMarkdown>;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('render default markdown error: ', error);
    return (
      <MuiMarkdown
        options={{
          disableParsingRawHTML: true,
          overrides: overrides(markedToken.raw),
        }}
      >
        {markedToken.raw}
      </MuiMarkdown>
    );
  }
};

const Token = ({
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
}) => {
  const theme = useTheme();
  const styles = getStyles();
  const overrides = useCallback(
    rawData => ({
      ...getOverrides(),
      ...MarkdownMapping,
      div: {
        component: StyledDiv,
        props: {},
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
      } else {
        return (
          <MuiMarkdown
            options={{
              disableParsingRawHTML: true,
              overrides: overrides(markedToken.raw),
            }}
          >
            {markedToken.raw}
          </MuiMarkdown>
        );
      }
    }
    case 'text':
      return (
        <Box
          component="span"
          sx={styles.text}
        >
          {markedToken.raw}
        </Box>
      );
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
      } else {
        return (
          <DefaultMarkdown
            markedToken={markedToken}
            overrides={overrides}
          />
        );
      }
    case 'html': {
      try {
        const isValidHtml = isValidHTMLTag(extractFirstHTMLTag(markedToken.raw)?.slice(1, -1));
        return (
          <MuiMarkdown
            options={{
              disableParsingRawHTML: !isValidHtml,
              overrides: overrides(markedToken.raw),
            }}
          >
            {markedToken.raw}
          </MuiMarkdown>
        );
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('render html markdown error: ', error);
        return (
          <MuiMarkdown
            options={{
              disableParsingRawHTML: true,
              overrides: overrides(markedToken.raw),
            }}
          >
            {markedToken.raw}
          </MuiMarkdown>
        );
      }
    }
    case 'paragraph': {
      try {
        return markedToken.tokens?.length ? (
          <Box
            component="p"
            sx={styles.paragraph}
          >
            {markedToken.tokens.map((token, idx) => (
              <Token
                markedToken={token}
                key={idx}
                renderHtml={renderHtml}
              />
            ))}
          </Box>
        ) : (
          <MuiMarkdown overrides={overrides(markedToken.raw)}>{markedToken.raw}</MuiMarkdown>
        );
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('render paragraph markdown error: ', error);
        return (
          <MuiMarkdown
            options={{
              disableParsingRawHTML: true,
              overrides: overrides(markedToken.raw),
            }}
          >
            {markedToken.raw}
          </MuiMarkdown>
        );
      }
    }
    default:
      return (
        <DefaultMarkdown
          markedToken={markedToken}
          overrides={overrides}
        />
      );
  }
};

const Markdown = ({
  children,
  renderHtml = true,
  interaction_uuid,
  conversation_uuid,
  isStreaming = false,
  onEdit,
  selectedCodeBlockInfo,
  canvasId,
  messageItemId,
  //For downloading table
  tableId,
  // For toolbar
  showToolbar,
}) => {
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
  // console.log('markedTokens======>', markedTokens)
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
          />
        ))}
      </Box>
    </ThemeProvider>
  );
};

const getStyles = () => ({
  container: {
    whiteSpace: 'pre-wrap',
    // Force all descendants to inherit whitespace preservation
    '& *': {
      whiteSpace: 'inherit',
    },
    // But allow code blocks to have their own whitespace handling
    '& pre, & code': {
      whiteSpace: 'pre-wrap',
    },
  },
  text: { whiteSpace: 'pre-wrap' },
  paragraph: {
    marginBlockStart: '0px',
    marginBottom: '0.8em',
    whiteSpace: 'pre-wrap',
  },
});

export default Markdown;
