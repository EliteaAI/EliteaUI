import { memo, useCallback, useId, useMemo, useState } from 'react';

import { Box, Collapse, Typography } from '@mui/material';

const SENSITIVE_PARAM_MASK = '***';

const SensitiveToolParams = memo(props => {
  const { toolArgs } = props;
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();

  const toggleExpanded = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

  const handleKeyDown = useCallback(
    event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleExpanded();
      }
    },
    [toggleExpanded],
  );

  const paramEntries = useMemo(() => {
    if (!toolArgs || typeof toolArgs !== 'object') return [];
    return Object.entries(toolArgs);
  }, [toolArgs]);

  if (paramEntries.length === 0) return null;

  return (
    <Box sx={styles.wrapper}>
      <Box
        sx={styles.header}
        onClick={toggleExpanded}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-controls={contentId}
      >
        <Typography
          variant="labelSmall"
          sx={styles.headerText}
        >
          Parameters {expanded ? '▾' : '▸'}
        </Typography>
      </Box>
      <Collapse
        in={expanded}
        id={contentId}
      >
        <Box sx={styles.paramList}>
          {paramEntries.map(([key, value]) => (
            <Box
              key={key}
              sx={styles.paramRow}
            >
              <Typography
                variant="labelSmall"
                sx={styles.paramKey}
              >
                {key}:
              </Typography>
              <Typography
                variant="labelSmall"
                sx={styles.paramValue}
              >
                {value === SENSITIVE_PARAM_MASK
                  ? SENSITIVE_PARAM_MASK
                  : String(typeof value === 'object' ? JSON.stringify(value) : value)}
              </Typography>
            </Box>
          ))}
        </Box>
      </Collapse>
    </Box>
  );
});

SensitiveToolParams.displayName = 'SensitiveToolParams';

/** @type {MuiSx} */
const styles = {
  wrapper: ({ palette }) => ({
    width: '100%',
    borderRadius: '0.375rem',
    border: `0.0625rem solid ${palette.border?.lines || palette.divider}`,
    overflow: 'hidden',
  }),
  header: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    padding: '0.375rem 0.625rem',
    cursor: 'pointer',
    userSelect: 'none',
    backgroundColor: palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
    '&:hover': {
      backgroundColor: palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
    },
  }),
  headerText: ({ palette }) => ({
    fontSize: '0.75rem',
    fontWeight: 600,
    color: palette.text.secondary,
  }),
  paramList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
    padding: '0.375rem 0.625rem',
  },
  paramRow: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'flex-start',
  },
  paramKey: ({ palette }) => ({
    fontSize: '0.75rem',
    fontWeight: 600,
    color: palette.text.secondary,
    flexShrink: 0,
  }),
  paramValue: ({ palette }) => ({
    fontSize: '0.75rem',
    fontWeight: 400,
    color: palette.text.primary,
    wordBreak: 'break-word',
  }),
};

export default SensitiveToolParams;
