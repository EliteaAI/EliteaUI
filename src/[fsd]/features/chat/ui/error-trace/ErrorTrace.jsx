import { memo, useCallback, useState } from 'react';

import { Box, IconButton, Typography } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import ArrowRightIcon from '@/assets/arrow-right-icon.svg?react';
import CopyIcon from '@/components/Icons/CopyIcon';
import DownloadIcon from '@/components/Icons/DownloadIcon';

// Error / stack-trace view shared by the whole-message exception (sequential and
// swarm flows) and a parallel sub-agent's own accordion (#4993). Renders the
// human-readable headline in a red wrapper, plus an on-demand "Error debugging
// info" expander exposing the full trace with download + copy. Extracted
// verbatim from ApplicationAnswer's inline block so both call sites stay
// pixel-identical; `compact` tightens spacing for the narrower accordion column.
const ErrorTrace = memo(props => {
  const { headline, trace, messageId, onCopy, compact = false } = props;

  const [isExpanded, setIsExpanded] = useState(false);

  const downloadErrorTrace = useCallback(() => {
    if (!trace) return;

    const element = document.createElement('a');
    const file = new Blob([trace], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `error-trace-${messageId || 'unknown'}-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(element.href);
  }, [trace, messageId]);

  const onClickCopy = useCallback(() => {
    onCopy && onCopy();
  }, [onCopy]);

  const styles = errorTraceStyles(isExpanded, compact);

  return (
    <>
      <Box sx={styles.errorWrapper}>{headline || 'Unknown error'}</Box>

      {trace && trace !== headline && (
        <Box sx={styles.errorStackTrace}>
          <Box
            sx={styles.errorStackTraceHeader}
            onClick={() => setIsExpanded(prev => !prev)}
          >
            <ArrowRightIcon />
            <Typography
              variant="bodyMedium"
              sx={styles.errorDebugText}
            >
              Error debugging info
            </Typography>
          </Box>

          {isExpanded && (
            <Box sx={styles.errorContent}>
              <Box sx={styles.errorTraceActions}>
                <StyledTooltip
                  title="Download error trace"
                  placement="top"
                >
                  <IconButton
                    sx={styles.iconButton}
                    variant="elitea"
                    color="tertiary"
                    onClick={downloadErrorTrace}
                  >
                    <DownloadIcon sx={styles.icon} />
                  </IconButton>
                </StyledTooltip>
                {onCopy && (
                  <StyledTooltip
                    title="Copy to clipboard"
                    placement="top"
                  >
                    <IconButton
                      sx={styles.iconButton}
                      variant="elitea"
                      color="tertiary"
                      onClick={onClickCopy}
                    >
                      <CopyIcon sx={styles.icon} />
                    </IconButton>
                  </StyledTooltip>
                )}
              </Box>
              <Typography
                component="pre"
                sx={styles.errorTraceContent}
              >
                {trace}
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </>
  );
});

ErrorTrace.displayName = 'ErrorTrace';

/** @type {MuiSx} */
const errorTraceStyles = (isExpanded, compact) => ({
  errorWrapper: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: '.75rem 1rem',
    border: ({ palette }) => `1px solid ${palette.background.wrongBkg}`,
    background: ({ palette }) => palette.background.errorBkg,
    borderRadius: '0.5rem',
    color: ({ palette }) => palette.text.warningText,
    fontSize: '.875rem',
    marginBottom: '0.5rem',
  },
  errorStackTrace: {
    width: '100%',
    marginTop: '0.5rem',
  },
  errorStackTraceHeader: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '.375rem',
    padding: '.25rem .5rem',
    borderRadius: '1rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease-in-out',
    width: '11.875rem',
    height: '1.5rem',
    marginBottom: isExpanded ? '0.5rem' : '0',

    span: {
      color: palette.text.default,
      fontSize: '.875rem',
    },

    svg: {
      transition: 'transform 0.2s ease-in-out',
      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',

      path: {
        fill: palette.text.default,
      },
    },

    '&:hover': {
      backgroundColor: palette.background.userInputBackgroundActive,
      span: {
        color: palette.text.secondary,
      },
    },
  }),
  errorTraceActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.5rem',
    marginBottom: '.625rem',
    height: '1.75rem',
  },
  errorContent: ({ palette }) => ({
    // Whole-message view keeps its generous bottom padding; the accordion
    // (compact) tightens it so the trace doesn't dwarf the child's column.
    padding: compact ? '.5rem 1rem 1rem 1rem' : '.5rem 1rem 2.875rem 1rem',
    backgroundColor: palette.background.userInputBackground,
    ...(compact && { maxHeight: '18rem', overflow: 'auto' }),
  }),
  errorTraceContent: {
    whiteSpace: 'pre-wrap',
    fontFamily: 'monospace',
    fontSize: '0.875rem',
    color: 'inherit',
    fontWeight: '400',
  },
  iconButton: {
    marginLeft: '0',
    minWidth: '1rem',
    width: '1rem',
    height: '1.75rem',
    padding: '0',
  },
  icon: {
    fontSize: '1rem',
  },
});

export default ErrorTrace;
