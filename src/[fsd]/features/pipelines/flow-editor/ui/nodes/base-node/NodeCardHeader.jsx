import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { NodeHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import NodeDeprecatedBadge from '@/[fsd]/features/pipelines/flow-editor/ui/nodes/base-node/NodeDeprecatedBadge';
import NodeEntrypointBadge from '@/[fsd]/features/pipelines/flow-editor/ui/nodes/base-node/NodeEntrypointBadge';
import NodeIconTile from '@/[fsd]/features/pipelines/flow-editor/ui/nodes/base-node/NodeIconTile';
import NodeStatusIcon from '@/[fsd]/features/pipelines/flow-editor/ui/nodes/base-node/NodeStatusIcon';

const NodeCardHeader = memo(props => {
  const { name, isEntrypoint, type, status, configIssues } = props;

  const isDeprecated = NodeHelpers.isDeprecatedNodeType(type);
  const styles = nodeCardHeaderStyles();

  return (
    <Box sx={styles.container}>
      <NodeIconTile type={type} />
      <Box sx={styles.textSection}>
        <Typography
          sx={styles.nameText}
          variant="bodyMedium"
          color="text.secondary"
          data-testid="pipeline-node-name"
        >
          {name}
        </Typography>
        <Typography
          sx={styles.typeText}
          variant="bodySmall"
          color="text.primary"
          noWrap
          data-testid="pipeline-node-type"
        >
          {FlowEditorConstants.PipelineNodeDisplayNames[type] || type}
        </Typography>
      </Box>
      <Box sx={styles.rightSection}>
        {isEntrypoint && <NodeEntrypointBadge />}
        {isDeprecated && <NodeDeprecatedBadge type={type} />}
        <NodeStatusIcon
          status={status}
          configIssues={configIssues}
        />
      </Box>
    </Box>
  );
});

NodeCardHeader.displayName = 'NodeCardHeader';

/** @type {MuiSx} */
const nodeCardHeaderStyles = () => ({
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    width: '100%',
    minWidth: 0,
  },
  textSection: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
  },
  nameText: {
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
  },
  typeText: {
    textOverflow: 'ellipsis',
  },
  rightSection: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '0.5rem',
    flexShrink: 1,
    minWidth: 0,
    maxWidth: '60%',
  },
});

export default NodeCardHeader;
