import React, { memo, useMemo } from 'react';

import { Box, Chip, CircularProgress, Divider, Link, Paper, Typography } from '@mui/material';

import { typographyVariants } from '@/MainTheme';
import { MdxStatus } from '@/[fsd]/features/artifacts/lib/constants/previewMdx.constants';
import { useMdxEvaluator } from '@/[fsd]/features/artifacts/lib/hooks';
import MdxAlert from '@/[fsd]/features/artifacts/ui/FilePreviewCanvas/MdxAlert';
import Markdown from '@/[fsd]/shared/ui/markdown';

const MdxPreview = memo(props => {
  const { mdxContent } = props;

  const styles = mdxPreviewStyles();

  const isEmpty = useMemo(() => !mdxContent || !mdxContent.trim(), [mdxContent]);
  const state = useMdxEvaluator(isEmpty ? '' : mdxContent);

  const mdxComponents = useMemo(
    () => ({
      h1: h1Props => (
        <Typography
          variant="headingMedium"
          component="h1"
          sx={styles.heading12}
          {...h1Props}
        />
      ),
      h2: h2Props => (
        <Typography
          variant="headingSmall"
          component="h2"
          sx={styles.heading12}
          {...h2Props}
        />
      ),
      h3: h3Props => (
        <Typography
          variant="labelMedium"
          component="h3"
          sx={styles.heading36}
          {...h3Props}
        />
      ),
      h4: h4Props => (
        <Typography
          variant="labelSmall"
          component="h4"
          sx={styles.heading36}
          {...h4Props}
        />
      ),
      h5: h5Props => (
        <Typography
          variant="bodyMedium"
          component="h5"
          sx={styles.heading36}
          {...h5Props}
        />
      ),
      h6: h6Props => (
        <Typography
          variant="bodyMedium"
          component="h6"
          sx={styles.heading36}
          {...h6Props}
        />
      ),
      p: pProps => (
        <p
          style={styles.paragraph}
          {...pProps}
        />
      ),
      a: aProps => (
        <Link
          target="_blank"
          variant="bodySmall"
          {...aProps}
        />
      ),
      ul: ulProps => (
        <ul
          style={styles.ul}
          {...ulProps}
        />
      ),
      ol: olProps => (
        <ol
          style={styles.ol}
          {...olProps}
        />
      ),
      li: liProps => (
        <li
          style={styles.li}
          {...liProps}
        />
      ),
      strong: strongProps => (
        <strong
          style={styles.inline}
          {...strongProps}
        />
      ),
      em: emProps => (
        <em
          style={styles.inline}
          {...emProps}
        />
      ),
      img: imgProps => {
        const { src, alt, ...rest } = imgProps;
        if (!src || !/^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\//.test(src)) return null;
        return (
          <img
            src={src}
            alt={alt}
            style={styles.img}
            {...rest}
          />
        );
      },
      Alert: alertProps => (
        <MdxAlert
          alertProps={alertProps}
          sx={styles.mdxAlert}
        />
      ),
      Callout: calloutProps => (
        <MdxAlert
          alertProps={calloutProps}
          defaultSeverity="info"
          severityProp="type"
          sx={styles.mdxAlert}
        />
      ),
      Note: noteProps => (
        <MdxAlert
          alertProps={noteProps}
          sx={styles.mdxAlert}
        />
      ),
      Warning: warningProps => (
        <MdxAlert
          alertProps={warningProps}
          defaultSeverity="warning"
          sx={styles.mdxAlert}
        />
      ),
      Tip: tipProps => (
        <MdxAlert
          alertProps={tipProps}
          defaultSeverity="success"
          sx={styles.mdxAlert}
        />
      ),
      Danger: dangerProps => (
        <MdxAlert
          alertProps={dangerProps}
          defaultSeverity="error"
          sx={styles.mdxAlert}
        />
      ),
      Card: cardProps => (
        <Paper
          variant="outlined"
          sx={styles.mdxCard}
        >
          {cardProps.children}
        </Paper>
      ),
      Badge: badgeProps => (
        <Chip
          label={badgeProps.children}
          size="small"
          color={badgeProps.color || 'default'}
          sx={styles.mdxBadge}
        />
      ),
      Divider: () => <Divider sx={styles.mdxDivider} />,
    }),
    [styles],
  );

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

  if (state.status === MdxStatus.LOADING) {
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

  if (state.status === MdxStatus.ERROR) {
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

  if (state.status === MdxStatus.SUCCESS && state.Component) {
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
      fontSize: '0.875rem',
    },

    '& th, & td': {
      border: `0.0625rem solid ${palette.border.lines}`,
      padding: '0.375rem 0.5rem',
      textAlign: 'left',
    },

    '& blockquote': {
      borderLeft: `0.1875rem solid ${palette.primary.main}`,
      marginLeft: 0,
      paddingLeft: '0.8em',
      color: palette.text.tertiary,
      fontStyle: 'italic',
    },
  }),

  heading12: ({ palette }) => ({
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
    paddingBottom: '0.4em',
    marginTop: '1.2em',
  }),

  heading36: {
    paddingBottom: '0.4em',
    marginTop: '1.2em',
  },

  paragraph: {
    marginBlockStart: '0rem',
    marginBottom: '0.8em',
    whiteSpace: 'pre-wrap',
  },

  inline: {
    whiteSpace: 'pre-wrap',
  },

  ul: {
    ...typographyVariants.bodyMedium,
    paddingLeft: '1.5rem',
    margin: '0.5rem 0',
    listStyleType: 'disc',
    listStylePosition: 'outside',
  },

  ol: {
    ...typographyVariants.bodyMedium,
    paddingLeft: '1.5rem',
    margin: '0.5rem 0',
    listStyleType: 'decimal',
    listStylePosition: 'outside',
  },

  li: {
    ...typographyVariants.bodyMedium,
    whiteSpaceCollapse: 'preserve',
    display: 'list-item',
    listStylePosition: 'outside',
    paddingLeft: '0.25rem',
    marginBottom: '0.25rem',
  },

  img: {
    maxWidth: '100%',
    borderRadius: '0.25rem',
  },

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

  mdxAlert: {
    my: '0.5rem',
  },

  mdxCard: {
    p: '1rem',
    my: '0.5rem',
    borderRadius: '0.5rem',
  },

  mdxBadge: {
    mr: '0.25rem',
  },

  mdxDivider: {
    my: '0.75rem',
  },
});

export default MdxPreview;
