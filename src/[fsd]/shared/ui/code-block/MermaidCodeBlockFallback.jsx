import { memo } from 'react';

import { Box, Typography } from '@mui/material';

const MermaidCodeBlockFallback = memo(props => {
  const { code = '' } = props;

  const styles = mermaidCodeBlockFallbackStyles();

  return (
    <Box
      sx={styles.root}
      data-testid="mermaid-code-block-fallback"
    >
      <Typography
        variant="bodySmall"
        sx={styles.notice}
      >
        The diagram could not be displayed. Showing its source instead.
      </Typography>
      <Box
        component="pre"
        sx={styles.code}
      >
        {code}
      </Box>
    </Box>
  );
});

MermaidCodeBlockFallback.displayName = 'MermaidCodeBlockFallback';

/** @type {MuiSx} */
const mermaidCodeBlockFallbackStyles = () => ({
  root: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '0.75rem',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    backgroundColor: palette.background.default.secondary,
  }),
  notice: ({ palette }) => ({
    color: palette.text.warning,
  }),
  code: ({ palette }) => ({
    margin: 0,
    overflowX: 'auto',
    whiteSpace: 'pre',
    fontFamily: 'monospace',
    fontSize: '0.8125rem',
    color: palette.text.primary,
  }),
});

export default MermaidCodeBlockFallback;
