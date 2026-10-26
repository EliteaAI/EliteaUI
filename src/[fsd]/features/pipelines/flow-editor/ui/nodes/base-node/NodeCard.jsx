import { memo, useContext, useEffect, useMemo } from 'react';

import { Box, useTheme } from '@mui/material';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import {
  NodeCardHelpers,
  NodeConfigHelpers,
  NodeHelpers,
  NodeSummaryHelpers,
} from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import NodeConfigSection from '@/[fsd]/features/pipelines/flow-editor/ui/node-panel/NodeConfigSection';
import NodeCardHeader from '@/[fsd]/features/pipelines/flow-editor/ui/nodes/base-node/NodeCardHeader';
import NodeSummary from '@/[fsd]/features/pipelines/flow-editor/ui/nodes/base-node/NodeSummary';
import { FlowEditorContext, NodeCardContext, NodeConfigPanelContext } from '@/[fsd]/shared/lib/context';
import { useStore } from '@xyflow/react';

const selectIsMiniCard = state => NodeCardHelpers.isMiniCardZoom(state.transform[2]);

/**
 * On the canvas the card is view-only: header plus a two-line summary. Inside the node configuration
 * panel the same node component renders its fields (`children`) instead.
 */
const NodeCard = memo(props => {
  const { name, isEntrypoint, children, selected, handles, isPerforming, type, id, requiredInputs } = props;
  const theme = useTheme();
  const { isRunningPipeline, expandAll, yamlJsonObject, reportNodeIssues } = useContext(FlowEditorContext);
  const panelContext = useContext(NodeConfigPanelContext);
  const isPanel = Boolean(panelContext);
  const isMiniCard = useStore(selectIsMiniCard);
  const isExpanded = expandAll && !isMiniCard;

  const yamlNode = useMemo(
    () => yamlJsonObject?.nodes?.find(node => node.id === id),
    [id, yamlJsonObject?.nodes],
  );
  const configIssues = useMemo(
    () => NodeConfigHelpers.getNodeConfigIssues(yamlNode, { requiredInputs }),
    [requiredInputs, yamlNode],
  );
  const isDeprecated = NodeHelpers.isDeprecatedNodeType(type);
  const summary = useMemo(
    () => NodeSummaryHelpers.getNodeSummary(yamlNode, { type, isDeprecated, requiredInputs }),
    [isDeprecated, requiredInputs, type, yamlNode],
  );

  useEffect(() => {
    if (isPanel || !reportNodeIssues) return;
    reportNodeIssues(id, configIssues);
  }, [configIssues, id, isPanel, reportNodeIssues]);

  useEffect(() => {
    if (isPanel || !reportNodeIssues) return;
    return () => reportNodeIssues(id, []);
  }, [id, isPanel, reportNodeIssues]);

  const status = NodeCardHelpers.getNodeCardStatus({
    isPerforming,
    hasConfigIssues: configIssues.length > 0,
  });
  const cardState = { status, selected, isRunningPipeline };
  const cardContextValue = useMemo(() => ({ isExpanded }), [isExpanded]);

  if (isPanel) {
    return panelContext.isLegacyLayout ? <NodeConfigSection>{children}</NodeConfigSection> : children;
  }

  const styles = nodeCardStyles({
    isExpanded,
    borderColor: NodeCardHelpers.getNodeCardBorderColor(cardState, theme.palette),
    boxShadow: NodeCardHelpers.getNodeCardShadow(cardState, theme.palette),
    hasHover: NodeCardHelpers.hasNodeCardHover(cardState),
    headerColor: NodeCardHelpers.getNodeCardHeaderColor(type, theme),
  });

  return (
    <NodeCardContext.Provider value={cardContextValue}>
      <Box
        sx={styles.container}
        data-testid={`pipeline-node-card-${id}`}
        data-status={status || undefined}
        data-mini={isMiniCard || undefined}
      >
        <Box sx={styles.header}>
          <NodeCardHeader
            isEntrypoint={isEntrypoint}
            name={name}
            type={type}
            status={status}
            configIssues={configIssues}
          />
        </Box>
        {isExpanded && (
          <NodeSummary
            primary={summary.primary}
            secondary={summary.secondary}
            isNotConfigured={configIssues.length > 0}
          />
        )}
        {handles && handles(isExpanded)}
      </Box>
    </NodeCardContext.Provider>
  );
});

NodeCard.displayName = 'NodeCard';

/** @type {MuiSx} */
const nodeCardStyles = ({ isExpanded, borderColor, boxShadow, hasHover, headerColor }) => ({
  container: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    width: `${FlowEditorConstants.NODE_CARD_WIDTH / 16}rem`,
    height: 'auto',
    padding: isExpanded ? '0 0 1.5rem' : 0,
    boxSizing: 'border-box',
    borderRadius: '0.75rem',
    position: 'relative',
    border: `0.0625rem solid ${borderColor}`,
    boxShadow,
    backgroundColor: palette.components.flowEditor.card.background,
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    cursor: 'pointer',
    ...(hasHover && {
      '&:hover': {
        borderColor: palette.components.flowEditor.card.border.hover,
        boxShadow: palette.components.flowEditor.card.shadow.hover,
      },
    }),
  }),
  header: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: '0.75rem 1rem',
    boxSizing: 'border-box',
    // Card radius minus its 1px border, so the header sits flush inside the card
    borderRadius: '0.6875rem',
    borderBottom: isExpanded ? `0.0625rem solid ${palette.components.flowEditor.card.header.border}` : 'none',
    backgroundColor: headerColor,
  }),
});

export default NodeCard;
