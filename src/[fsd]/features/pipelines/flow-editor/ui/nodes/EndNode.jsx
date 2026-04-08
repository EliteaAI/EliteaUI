import { memo, useContext } from 'react';

import { Box, Typography } from '@mui/material';

import { FlowEditorContext, NodeCardContext } from '@/[fsd]/app/providers';
import FlagIcon from '@/assets/flag-icon.svg?react';
import { Handle } from '@xyflow/react';

const EndNode = memo(props => {
  const { selected, data } = props;

  const { isRunningPipeline, expandAll } = useContext(FlowEditorContext);

  const styles = endNodeStyles(data, isRunningPipeline, selected);

  return (
    <NodeCardContext.Provider value={{ isExpanded: expandAll }}>
      <Box sx={styles.container}>
        <Box sx={styles.iconContainer}>
          <FlagIcon style={styles.icon} />
        </Box>
        <Typography
          variant="labelMedium"
          color="text.secondary"
        >
          End
        </Typography>
        <Handle
          type="target"
          id="target"
          isConnectable
          selected={selected}
          style={styles.handle}
        />
      </Box>
    </NodeCardContext.Provider>
  );
});

EndNode.displayName = 'EndNode';

/** @type {MuiSx} */
const endNodeStyles = (data, isRunningPipeline, selected) => ({
  container: ({ palette }) => ({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '6.25rem',
    height: '2.75rem',
    padding: '0.5rem 1rem 0.5rem 0.75rem',
    borderRadius: '0.5rem',
    border: `${data?.isPerforming ? '2px dashed' : '1px solid'} ${
      data?.isPerforming || (!isRunningPipeline && selected) ? palette.primary.main : palette.border.flowNode
    }`,
    background: palette.background.tabPanel,
  }),
  handle: {
    width: '0.75rem',
    height: '0.75rem',
    borderRadius: '50%',
  },
  iconContainer: ({ palette }) => ({
    width: '1.5rem',
    height: '1.5rem',
    borderRadius: '0.25rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    border: `1px solid ${palette.border.flowNode}`,
    color: palette.text.secondary,
    marginRight: '0.5rem',
  }),
  icon: {
    width: '1rem',
    height: '1rem',
  },
});

export default EndNode;
