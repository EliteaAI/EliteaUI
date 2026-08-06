import { memo } from 'react';

import Markdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

import { Box } from '@mui/material';

const TooltipMarkdownContent = memo(props => {
  const { children: externalChildren } = props;
  const styles = tooltipMarkdownContentStyles();

  if (!externalChildren) return null;

  return (
    <Box sx={styles.root}>
      <Markdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
            >
              {children}
            </a>
          ),
        }}
      >
        {externalChildren}
      </Markdown>
    </Box>
  );
});

TooltipMarkdownContent.displayName = 'TooltipMarkdownContent';

/** @type {MuiSx} */
const tooltipMarkdownContentStyles = () => ({
  root: ({ palette }) => ({
    '& p': {
      margin: 0,
    },

    '& strong': {
      fontWeight: 700,
    },

    '& ul': {
      margin: 0,
      paddingLeft: '1rem',
      listStyleType: 'disc',
    },

    '& ol': {
      margin: 0,
      paddingLeft: '1rem',
      listStyleType: 'decimal',
    },

    '& li': {
      marginBottom: 0,
    },

    '& a': {
      color: 'inherit',
      textDecoration: 'underline',
    },

    '& code': {
      fontFamily: 'monospace',
      fontSize: '0.85em',
      backgroundColor: palette.background.tooltip.code,
      borderRadius: '.1875rem',
      padding: '.0625rem .25rem',
      overflowWrap: 'anywhere',
    },

    '& pre': {
      margin: 0,
      padding: '.25rem .5rem',
      backgroundColor: palette.background.tooltip.code,
      borderRadius: '.1875rem',
      whiteSpace: 'pre-wrap',
      overflowWrap: 'anywhere',
    },

    '& pre code': {
      backgroundColor: 'transparent',
      padding: 0,
    },
  }),
});

export default TooltipMarkdownContent;
