import { memo, useContext } from 'react';

import { Box, Typography, useTheme } from '@mui/material';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { NodeCardHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import NodeIconTile from '@/[fsd]/features/pipelines/flow-editor/ui/nodes/base-node/NodeIconTile';
import { FlowEditorContext, NodeCardContext } from '@/[fsd]/shared/lib/context';
import FlagIcon from '@/assets/flag-icon.svg?react';
import { Handle, Position } from '@xyflow/react';

const CARD_CONTEXT_VALUE = { isExpanded: true };

const EndNode = memo(props => {
  const { selected, data } = props;
  const theme = useTheme();

  const { isRunningPipeline, orientation } = useContext(FlowEditorContext);
  const isHorizontal = orientation === FlowEditorConstants.ORIENTATION.horizontal;

  const cardState = {
    status: NodeCardHelpers.getNodeCardStatus({ isPerforming: data?.isPerforming }),
    selected,
    isRunningPipeline,
  };
  const styles = endNodeStyles({
    borderColor: NodeCardHelpers.getNodeCardBorderColor(cardState, theme.palette),
    boxShadow: NodeCardHelpers.getNodeCardShadow(cardState, theme.palette),
    hasHover: NodeCardHelpers.hasNodeCardHover(cardState),
  });

  return (
    <NodeCardContext.Provider value={CARD_CONTEXT_VALUE}>
      <Box
        sx={styles.container}
        data-testid="pipeline-end-node"
      >
        <NodeIconTile size="small">
          <FlagIcon style={styles.icon} />
        </NodeIconTile>
        <Typography
          variant="bodyMedium"
          color="text.secondary"
        >
          End
        </Typography>
        <Handle
          type="target"
          id="target"
          position={isHorizontal ? Position.Left : Position.Top}
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
const endNodeStyles = ({ borderColor, boxShadow, hasHover }) => ({
  container: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    width: '6.25rem',
    height: '2.75rem',
    padding: '0.5rem 1rem 0.5rem 0.625rem',
    boxSizing: 'border-box',
    borderRadius: '0.75rem',
    border: `0.0625rem solid ${borderColor}`,
    boxShadow,
    backgroundColor: palette.components.flowEditor.card.background,
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    ...(hasHover && {
      '&:hover': {
        borderColor: palette.components.flowEditor.card.border.hover,
        boxShadow: palette.components.flowEditor.card.shadow.hover,
      },
    }),
  }),
  handle: {
    width: '0.75rem',
    height: '0.75rem',
    borderRadius: '50%',
  },
  icon: {
    width: '1rem',
    height: '1rem',
  },
});

export default EndNode;
