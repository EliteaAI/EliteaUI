import { memo, useCallback, useContext, useMemo, useState } from 'react';

import { Box } from '@mui/material';

import {
  FlowEditorConstants,
  NodePanelConstants,
} from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { NodeHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { FlowEditorContext, NodeConfigPanelContext } from '@/[fsd]/shared/lib/context';

import NodeConfigFooter from './NodeConfigFooter';
import NodeConfigPanelHeader from './NodeConfigPanelHeader';
import NodeConfigViewToggle from './NodeConfigViewToggle';
import NodeDeprecationBanner from './NodeDeprecationBanner';
import NodeNameField from './NodeNameField';
import NodeYamlView from './NodeYamlView';

/**
 * Right-side configuration of the selected node. It renders the node's own component in panel mode,
 * so every field, hook and YAML write is the one the card used before.
 */
const NodeConfigPanel = memo(props => {
  const { flowNode, NodeComponent, onClose, onRenamed } = props;
  const flowEditorContext = useContext(FlowEditorContext);
  const { yamlJsonObject, isRunningPipeline, disabled, requestNodeLeave } = flowEditorContext;
  const [view, setView] = useState(NodePanelConstants.NODE_CONFIG_VIEWS.flow);
  const isYamlView = view === NodePanelConstants.NODE_CONFIG_VIEWS.yaml;

  const { id, type, data } = flowNode;
  const isEntrypoint = yamlJsonObject?.entry_point === id;
  const isDeprecated = NodeHelpers.isDeprecatedNodeType(type);
  // Types without a Basic/Advanced split show all of their current fields in Basic
  const isLegacyDecision =
    type === FlowEditorConstants.PipelineNodeTypes.Decision &&
    id.endsWith(FlowEditorConstants.DECISION_NODE_ID_SUFFIX);
  const isLegacyLayout =
    isDeprecated || type === FlowEditorConstants.PipelineNodeTypes.Default || isLegacyDecision;
  const isReadOnly = isRunningPipeline || disabled;
  // Decision and Condition cards are named by their label. A legacy inline decision's label is a fixed
  // caption, not a YAML id, so it can't be renamed
  const usesLabelAsName =
    type === FlowEditorConstants.PipelineNodeTypes.Decision ||
    type === FlowEditorConstants.PipelineNodeTypes.Condition;

  const handleRenamed = useCallback(newId => onRenamed?.(id, newId), [id, onRenamed]);

  // Leaving the YAML view with a draft that can't be applied asks to fix or discard it first
  const onViewChange = useCallback(
    newView => {
      const switchView = () => setView(newView);
      if (isYamlView && requestNodeLeave) requestNodeLeave(switchView);
      else switchView();
    },
    [isYamlView, requestNodeLeave],
  );

  // Deprecated nodes are edited only in the YAML view: their form fields render disabled
  const formContextValue = useMemo(
    () => (isDeprecated ? { ...flowEditorContext, disabled: true } : flowEditorContext),
    [flowEditorContext, isDeprecated],
  );

  const panelContextValue = useMemo(() => ({ isEntrypoint, isLegacyLayout }), [isEntrypoint, isLegacyLayout]);

  const styles = nodeConfigPanelStyles();

  return (
    <Box
      sx={styles.root}
      className="nokey"
      data-testid="pipeline-node-panel"
      data-node-id={id}
    >
      <NodeConfigPanelHeader
        type={type}
        onClose={onClose}
      />
      <Box sx={styles.body}>
        <Box>
          <NodeConfigViewToggle
            value={view}
            onChange={onViewChange}
          />
        </Box>
        <NodeNameField
          name={usesLabelAsName ? data?.label || id : id}
          type={type}
          onRenamed={handleRenamed}
          isLocked={isLegacyDecision || isDeprecated}
        />
        {isDeprecated && <NodeDeprecationBanner type={type} />}
        {isYamlView ? (
          <NodeYamlView
            flowNodeId={id}
            onRenamed={handleRenamed}
            isReadOnly={isReadOnly}
          />
        ) : (
          <FlowEditorContext.Provider value={formContextValue}>
            <NodeConfigPanelContext.Provider value={panelContextValue}>
              {NodeComponent && (
                <NodeComponent
                  key={id}
                  id={id}
                  type={type}
                  data={data}
                  selected={false}
                />
              )}
            </NodeConfigPanelContext.Provider>
          </FlowEditorContext.Provider>
        )}
      </Box>
      {!isReadOnly && (
        <NodeConfigFooter
          id={id}
          type={type}
          isEntrypoint={isEntrypoint}
          canMakeEntrypoint={!isDeprecated}
        />
      )}
    </Box>
  );
});

NodeConfigPanel.displayName = 'NodeConfigPanel';

/** @type {MuiSx} */
const nodeConfigPanelStyles = () => ({
  root: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    width: `${FlowEditorConstants.NODE_PANEL_WIDTH / 16}rem`,
    height: '100%',
    boxSizing: 'border-box',
    // The canvas frame's radius rounds the right corners (NodeConfigDrawer lays this border over the frame's)
    borderRadius: '0.75rem 0 0 0.75rem',
    border: `0.0625rem solid ${palette.components.flowEditor.panel.border}`,
    backgroundColor: palette.components.flowEditor.panel.background,
    boxShadow: palette.components.flowEditor.panel.shadow,
    overflow: 'hidden',
  }),
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    padding: '1rem 1.5rem',
  },
});

export default NodeConfigPanel;
