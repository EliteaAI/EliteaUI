import { memo } from 'react';

import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import { Box, CircularProgress } from '@mui/material';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';

const NodeStatusIcon = memo(props => {
  const { status } = props;
  const styles = nodeStatusIconStyles();

  if (!status) return null;

  return (
    <Box
      sx={styles.root}
      data-testid={`pipeline-node-status-${status}`}
    >
      {status === FlowEditorConstants.NodeCardStatus.running ? (
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
  spinner: ({ palette }) => ({
    color: palette.components.flowEditor.card.status.running,
  }),
  errorIcon: ({ palette }) => ({
    fontSize: '1.25rem',
    color: palette.components.flowEditor.card.status.error,
  }),
});

export default NodeStatusIcon;
