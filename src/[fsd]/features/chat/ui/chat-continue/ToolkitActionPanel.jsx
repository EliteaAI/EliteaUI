import { memo, useCallback, useId, useState } from 'react';

import { Box, Collapse, Typography } from '@mui/material';

/**
 * The orange "action needed" panel of a toolkit: a title, a message, optional collapsible details and the
 * action buttons as children. The chat authorization prompt and the schedule "Action needed" card share it.
 * `detailRows` is a list of [label, value] pairs.
 */
const ToolkitActionPanel = memo(props => {
  const { title, message, detailRows = [], children, ...restProps } = props;
  const [showDetails, setShowDetails] = useState(false);
  const detailsId = useId();
  const styles = toolkitActionPanelStyles();

  const toggleDetails = useCallback(() => {
    setShowDetails(current => !current);
  }, []);

  return (
    <Box
      sx={styles.authorizationContainer}
      {...restProps}
    >
      <Typography
        component="div"
        variant="labelMedium"
        sx={styles.authorizationTitle}
      >
        {title}
      </Typography>
      {message && (
        <Typography
          variant="labelMedium"
          sx={styles.authorizationMessage}
        >
          {message}
        </Typography>
      )}
      {detailRows.length > 0 && (
        <Box sx={styles.detailsWrapper}>
          <Box
            role="button"
            tabIndex={0}
            aria-expanded={showDetails}
            aria-controls={detailsId}
            onClick={toggleDetails}
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleDetails();
              }
            }}
            sx={styles.detailsHeader}
          >
            <Typography
              variant="labelSmall"
              sx={styles.detailsHeaderText}
            >
              Authorization details {showDetails ? '▾' : '▸'}
            </Typography>
          </Box>
          <Collapse
            in={showDetails}
            id={detailsId}
          >
            <Box sx={styles.detailsList}>
              {detailRows.map(([label, value]) => (
                <Box
                  key={label}
                  sx={styles.detailsRow}
                >
                  <Typography
                    variant="labelSmall"
                    sx={styles.detailsLabel}
                  >
                    {label}:
                  </Typography>
                  <Typography
                    variant="labelSmall"
                    sx={styles.detailsValue}
                  >
                    {value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Collapse>
        </Box>
      )}
      {children && <Box sx={styles.buttonContainer}>{children}</Box>}
    </Box>
  );
});

ToolkitActionPanel.displayName = 'ToolkitActionPanel';

/** @type {MuiSx} */
const toolkitActionPanelStyles = () => ({
  authorizationContainer: ({ palette }) => ({
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    padding: '0.625rem 0.75rem',
    gap: '0.5rem',
    borderRadius: '0.625rem',
    background: palette.background.surface.interactive.active,
    border: `0.0625rem solid ${palette.warning.main}`,
    alignItems: 'flex-start',
  }),
  authorizationTitle: ({ palette }) => ({
    fontSize: '0.875rem',
    fontWeight: 600,
    lineHeight: '1.25rem',
    color: palette.warning.main,
  }),
  authorizationMessage: ({ palette }) => ({
    fontSize: '0.8125rem',
    fontWeight: 400,
    lineHeight: '1.25rem',
    color: palette.text.secondary,
  }),
  detailsWrapper: ({ palette }) => ({
    width: '100%',
    borderRadius: '0.375rem',
    border: `0.0625rem solid ${palette.border?.lines || palette.divider}`,
    overflow: 'hidden',
  }),
  detailsHeader: ({ palette }) => ({
    padding: '0.375rem 0.625rem',
    cursor: 'pointer',
    userSelect: 'none',
    backgroundColor: palette.action.hover,
  }),
  detailsHeaderText: ({ palette }) => ({
    fontSize: '0.75rem',
    fontWeight: 600,
    color: palette.text.secondary,
  }),
  detailsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    padding: '0.5rem 0.625rem',
  },
  detailsRow: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'flex-start',
  },
  detailsLabel: ({ palette }) => ({
    fontSize: '0.75rem',
    fontWeight: 600,
    color: palette.text.secondary,
    flexShrink: 0,
  }),
  detailsValue: ({ palette }) => ({
    fontSize: '0.75rem',
    fontWeight: 400,
    color: palette.text.primary,
    overflowWrap: 'anywhere',
  }),
  buttonContainer: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
  },
});

export default ToolkitActionPanel;
