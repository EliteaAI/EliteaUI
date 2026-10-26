import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { NodePanelConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';

const NodeSummary = memo(props => {
  const { primary, secondary, isNotConfigured } = props;
  const styles = nodeSummaryStyles();

  return (
    <Box
      sx={styles.root}
      data-testid="pipeline-node-summary"
    >
      {isNotConfigured ? (
        <Typography
          variant="bodySmall"
          sx={styles.notConfigured}
          noWrap
          data-testid="pipeline-node-not-configured"
        >
          {NodePanelConstants.NODE_NOT_CONFIGURED_TEXT}
        </Typography>
      ) : (
        <>
          <Typography
            variant="bodySmall"
            color="text.secondary"
            noWrap
            data-testid="pipeline-node-summary-primary"
          >
            {primary || '—'}
          </Typography>
          {secondary && (
            <Typography
              variant="bodySmall"
              color="text.primary"
              noWrap
              data-testid="pipeline-node-summary-secondary"
            >
              {secondary}
            </Typography>
          )}
        </>
      )}
    </Box>
  );
});

NodeSummary.displayName = 'NodeSummary';

/** @type {MuiSx} */
const nodeSummaryStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    width: '100%',
    minWidth: 0,
    padding: '0.75rem 1rem 0',
    boxSizing: 'border-box',
  },
  notConfigured: ({ palette }) => ({
    color: palette.text.warning,
  }),
});

export default NodeSummary;
