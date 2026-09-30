import { memo, useCallback, useContext, useEffect, useState } from 'react';

import { Box } from '@mui/material';

import { NodeHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import NodeBodyContainer from '@/[fsd]/features/pipelines/flow-editor/ui/nodes/base-node/NodeBodyContainer';
import NodeCardHeader from '@/[fsd]/features/pipelines/flow-editor/ui/nodes/base-node/NodeCardHeader';
import { TriggerTypeSelector } from '@/[fsd]/features/pipelines/flow-editor/ui/settings';
import { FlowEditorContext, NodeCardContext } from '@/[fsd]/shared/lib/context';

const NodeCard = memo(props => {
  const { name, isEntrypoint, children, selected, isConditionNode, handles, isPerforming, type, id } = props;
  const [isExpanded, setIsExpanded] = useState(true);
  const { isRunningPipeline, expandAll, disabled } = useContext(FlowEditorContext);

  const onExpand = useCallback(newState => {
    setIsExpanded(newState);
  }, []);

  useEffect(() => {
    setIsExpanded(expandAll);
  }, [expandAll]);

  const styles = nodeCardStyles(isExpanded, isPerforming, isRunningPipeline, selected, type);

  return (
    <NodeCardContext.Provider value={{ isExpanded }}>
      <Box sx={styles.container}>
        <Box sx={styles.header}>
          <NodeCardHeader
            isEntrypoint={isEntrypoint}
            name={name}
            isExpanded={isExpanded}
            onExpand={onExpand}
            isConditionNode={isConditionNode}
            type={type}
            id={id}
            disabled={disabled}
          />
        </Box>
        <NodeBodyContainer display={isExpanded ? 'flex' : 'none'}>
          {isEntrypoint && <TriggerTypeSelector disabled={isRunningPipeline || disabled} />}
          {children}
        </NodeBodyContainer>
        {handles && handles(isExpanded)}
      </Box>
    </NodeCardContext.Provider>
  );
});

NodeCard.displayName = 'NodeCard';

/** @type {MuiSx} */
const nodeCardStyles = (isExpanded, isPerforming, isRunningPipeline, selected, type) => ({
  container: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    width: '29.4375rem',
    height: 'auto',
    borderRadius: '.5rem',
    position: 'relative',
    border: `${isPerforming ? '.125rem dashed' : '.0625rem solid'} ${
      isPerforming || (!isRunningPipeline && selected)
        ? palette.primary.main
        : palette.components.flowEditor.node.border
    }`,
    background: palette.background.default.tertiary,
  }),
  header: ({ palette }) => ({
    height: '2.75rem',
    display: 'flex',
    padding: '.5rem 1rem',
    width: '100%',
    boxSizing: 'border-box',
    alignItems: 'center',
    overflow: 'hidden',
    borderBottom: isExpanded ? `.0625rem solid ${palette.components.flowEditor.node.border}` : 'none',
    backgroundColor: theme => NodeHelpers.getNodeColor(type, theme),
    borderRadius: isExpanded ? '.5rem .5rem 0 0' : '.5rem',
  }),
});

export default NodeCard;
