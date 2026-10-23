import { memo } from 'react';

import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import { Box, CircularProgress, Tooltip } from '@mui/material';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';

const { NodeCardStatus } = FlowEditorConstants;

const NodeStatusIcon = memo(props => {
  const { status, configIssues = [] } = props;
  const styles = nodeStatusIconStyles();

  if (!status) return null;

  if (status === NodeCardStatus.needsConfiguration) {
    return (
      <Tooltip
        placement="top"
        title={configIssues.map(issue => (
          <Box
            key={issue}
            component="span"
            sx={styles.tooltipLine}
          >
            {issue}
          </Box>
        ))}
      >
        <Box
          sx={styles.root}
          data-testid={`pipeline-node-status-${status}`}
        >
          <ErrorOutlineRoundedIcon sx={styles.needsConfigurationIcon} />
        </Box>
      </Tooltip>
    );
  }

  return (
    <Box
      sx={styles.root}
      data-testid={`pipeline-node-status-${status}`}
    >
      {status === NodeCardStatus.running ? (
        <CircularProgress
          size="1rem"
          thickness={5}
          sx={styles.spinner}
        />
      ) : (
        <HighlightOffOutlinedIcon sx={styles.errorIcon} />
      )}
    </Box>
  );
});

NodeStatusIcon.displayName = 'NodeStatusIcon';

/** @type {MuiSx} */
const nodeStatusIconStyles = () => ({
  root: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    width: '1.5rem',
    height: '1.5rem',
  },
  tooltipLine: {
    display: 'block',
  },
  spinner: ({ palette }) => ({
    color: palette.components.flowEditor.card.status.running,
  }),
  errorIcon: ({ palette }) => ({
    fontSize: '1.25rem',
    color: palette.components.flowEditor.card.status.error,
  }),
  needsConfigurationIcon: ({ palette }) => ({
    fontSize: '1.25rem',
    color: palette.components.flowEditor.card.status.needsConfiguration,
  }),
});

export default NodeStatusIcon;
