import React, { memo, useEffect, useMemo, useState } from 'react';

import { Alert, Box, Chip, CircularProgress, Divider, Paper, Typography } from '@mui/material';

import Markdown from '@/[fsd]/shared/ui/markdown';

// Pre-process MDX before evaluation:
// 1. Strip YAML frontmatter (--- ... ---) which @mdx-js/mdx cannot parse by default
// 2. Strip bare import statements — they can't be resolved at browser runtime via evaluate()
//    (export function / export const are kept — they compile fine as inline definitions)
const preprocessMdx = source => {
  let processed = source;

  // Strip YAML frontmatter at the start of the file
  processed = processed.replace(/^---[\s\S]*?---\s*/m, '');

  // Strip import statements (import ... from '...' or import '...')
  processed = processed.replace(/^import\s[^;]*?['"][^'"]*['"]\s*;?\s*$/gm, '');

  return processed.trim();
};

// MUI-backed component registry for common MDX components.
// Unknown components fall back to a plain div with the tag name as a label.
const mdxComponents = {
  Alert: props => (
    <Alert
      severity={props.severity || 'info'}
      sx={{ my: '0.5rem' }}
    >
      {props.children}
    </Alert>
  ),
  Callout: props => (
    <Alert
      severity={props.type || 'info'}
      sx={{ my: '0.5rem' }}
    >
      {props.children}
    </Alert>
  ),
  Note: props => (
    <Alert
      severity="info"
      sx={{ my: '0.5rem' }}
    >
      {props.children}
    </Alert>
  ),
  Warning: props => (
    <Alert
      severity="warning"
      sx={{ my: '0.5rem' }}
    >
      {props.children}
    </Alert>
  ),
  Tip: props => (
    <Alert
      severity="success"
      sx={{ my: '0.5rem' }}
    >
      {props.children}
    </Alert>
  ),
  Danger: props => (
    <Alert
      severity="error"
      sx={{ my: '0.5rem' }}
    >
      {props.children}
    </Alert>
  ),
  Card: props => (
    <Paper
      variant="outlined"
      sx={{ p: '1rem', my: '0.5rem', borderRadius: '0.5rem' }}
    >
      {props.children}
    </Paper>
  ),
  Badge: props => (
    <Chip
      label={props.children}
      size="small"
      color={props.color || 'default'}
      sx={{ mr: '0.25rem' }}
    />
  ),
  Divider: () => <Divider sx={{ my: '0.75rem' }} />,
};

const evaluateMdx = async source => {
  const processed = preprocessMdx(source);
  const [{ evaluate }, runtime, { default: remarkGfm }] = await Promise.all([
    import('@mdx-js/mdx'),
    import('react/jsx-runtime'),
    import('remark-gfm'),
  ]);
  const { default: MDXContent } = await evaluate(processed, {
    ...runtime,
    remarkPlugins: [remarkGfm],
    development: false,
  });
  return MDXContent;
};

const MdxPreview = memo(props => {
  const { mdxContent } = props;

  const styles = mdxPreviewStyles();

  const [state, setState] = useState({ status: 'idle', Component: null, error: null });

  const isEmpty = useMemo(() => !mdxContent || !mdxContent.trim(), [mdxContent]);

  useEffect(() => {
    if (isEmpty) {
      setState({ status: 'idle', Component: null, error: null });
      return;
    }

    setState({ status: 'loading', Component: null, error: null });

    evaluateMdx(mdxContent)
      .then(Component => {
        setState({ status: 'success', Component, error: null });
      })
      .catch(err => {
        setState({ status: 'error', Component: null, error: err?.message || String(err) });
      });
  }, [mdxContent, isEmpty]);

  if (isEmpty) {
    return (
      <Box sx={styles.fallbackWrapper}>
        <Typography
          variant="bodyMedium"
          sx={styles.fallbackTitle}
        >
          No content to display
        </Typography>
        <Typography
          variant="bodySmall"
          sx={styles.fallbackDescription}
        >
          The MDX file appears to be empty.
        </Typography>
      </Box>
    );
  }

  if (state.status === 'loading') {
    return (
      <Box sx={styles.loaderWrapper}>
        <CircularProgress
          size={28}
          sx={styles.circularProgress}
        />
        <Typography
          variant="bodySmall"
          sx={styles.loadingText}
        >
          Rendering MDX…
        </Typography>
      </Box>
    );
  }

  if (state.status === 'error') {
    // Compile failed — fall back to stripping and rendering as plain Markdown
    return (
      <Box sx={styles.wrapper}>
        <Box sx={styles.warningBanner}>
          <Typography
            variant="bodySmall"
            sx={styles.warningText}
          >
            MDX compilation failed. Showing plain Markdown fallback.
          </Typography>
        </Box>
        <Box sx={styles.markdownWrapper}>
          <Markdown>{mdxContent}</Markdown>
        </Box>
      </Box>
    );
  }

  if (state.status === 'success' && state.Component) {
    const MDXContent = state.Component;
    return (
      <Box sx={styles.markdownWrapper}>
        <MDXContent components={mdxComponents} />
      </Box>
    );
  }

  return null;
});

MdxPreview.displayName = 'MdxPreview';

/** @type {MuiSx} */
const mdxPreviewStyles = () => ({
  wrapper: ({ palette }) => ({
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: palette.background.secondary,
    height: '100%',
    overflow: 'hidden',
  }),

  warningBanner: ({ palette }) => ({
    padding: '0.5rem 1rem',
    backgroundColor: palette.background.tabPanel,
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
    flexShrink: 0,
  }),

  warningText: ({ palette }) => ({
    color: palette.text.secondary,
  }),

  markdownWrapper: ({ palette }) => ({
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
    padding: '0.75rem 1rem',
    backgroundColor: palette.background.secondary,
    overflowY: 'auto',
    overflowX: 'hidden',
    WebkitOverflowScrolling: 'touch',

    '&::-webkit-scrollbar': {
      width: '0.25rem',
    },

    '&::-webkit-scrollbar-track': {
      background: palette.background.tabPanel,
    },

    '&::-webkit-scrollbar-thumb': {
      background: palette.border.lines,
      borderRadius: '0.125rem',
    },

    '&::-webkit-scrollbar-thumb:hover': {
      background: palette.text.tertiary,
    },

    // Prose styles applied to MDX-rendered output
    '& p': {
      color: 'inherit',
      lineHeight: 1.6,
      marginBottom: '0.75em',
      fontSize: '0.8125rem',
    },

    '& h1, & h2, & h3, & h4, & h5, & h6': {
      lineHeight: 1.3,
      marginBottom: '0.5em',
      marginTop: '1em',
      fontWeight: 600,
    },

    '& pre': {
      backgroundColor: palette.background.tabPanel,
      border: `0.0625rem solid ${palette.border.lines}`,
      borderRadius: '0.25rem',
      padding: '0.5rem',
      overflow: 'auto',
      marginBottom: '0.8em',
      fontSize: '0.75rem',
    },

    '& code': {
      backgroundColor: palette.background.tabPanel,
      padding: '0.0625rem 0.1875rem',
      borderRadius: '0.125rem',
      fontSize: '0.6875rem',
      color: palette.text.primary,
    },

    '& pre code': {
      backgroundColor: 'transparent',
      padding: 0,
    },

    '& table': {
      borderCollapse: 'collapse',
      marginBottom: '0.8em',
      width: '100%',
      fontSize: '0.75rem',
    },

    '& th, & td': {
      border: `0.0625rem solid ${palette.border.lines}`,
      padding: '0.375rem 0.5rem',
      textAlign: 'left',
    },

    '& ul, & ol': {
      paddingLeft: '1.5em',
      marginBottom: '0.8em',
      fontSize: '0.8125rem',
    },

    '& li': {
      marginBottom: '0.2em',
    },

    '& blockquote': {
      borderLeft: `0.1875rem solid ${palette.primary.main}`,
      marginLeft: 0,
      paddingLeft: '0.8em',
      color: palette.text.tertiary,
      fontStyle: 'italic',
    },

    '& a': {
      color: palette.primary.main,
      textDecoration: 'none',
      '&:hover': { textDecoration: 'underline' },
    },

    '& img': {
      maxWidth: '100%',
      borderRadius: '0.25rem',
    },
  }),

  loaderWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: '0.5rem',
  },

  circularProgress: ({ palette }) => ({
    color: palette.primary.main,
  }),

  loadingText: ({ palette }) => ({
    color: palette.text.tertiary,
  }),

  fallbackWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    textAlign: 'center',
    padding: '1.5rem',
  },

  fallbackTitle: ({ palette }) => ({
    color: palette.text.secondary,
    marginBottom: '0.5rem',
  }),

  fallbackDescription: ({ palette }) => ({
    color: palette.text.tertiary,
  }),
});

export default MdxPreview;
