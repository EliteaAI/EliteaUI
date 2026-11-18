import { memo, useMemo } from 'react';

import { Box } from '@mui/material';

import { FlowEditorAddNode } from '@/[fsd]/features/pipelines/flow-editor/ui';
import { EntityTestPanelUI } from '@/[fsd]/widgets/entity-test-panel';
import { PipelineEditorMode } from '@/common/constants';
import GroupedButton from '@/components/GroupedButton';

const CanvasToolbar = memo(props => {
  const {
    mode,
    onModeChange,
    onAddNode,
    onTestPipeline,
    testDisabledReason,
    disabled,
    isCompact = false,
    extraActions,
  } = props;

  const modeItems = useMemo(
    () => Object.entries(PipelineEditorMode).map(([label, value]) => ({ label, value })),
    [],
  );

  const isFlowMode = mode === PipelineEditorMode.Flow;
  const styles = canvasToolbarStyles(isCompact);

  return (
    <Box sx={styles.root}>
      <GroupedButton
        value={mode}
        onChange={onModeChange}
        buttonItems={modeItems}
      />
      <Box sx={styles.actions}>
        {extraActions && <Box sx={styles.extraActionsWrapper}>{extraActions}</Box>}
        {isFlowMode && (
          <FlowEditorAddNode.AddNodeButton
            onAddNode={onAddNode}
            disabled={disabled}
          />
        )}
        {onTestPipeline && (
          <EntityTestPanelUI.TestEntityButton
            label="Test Pipeline"
            onClick={onTestPipeline}
            disabledReason={testDisabledReason}
            testId="pipeline-test-button"
          />
        )}
      </Box>
    </Box>
  );
});

CanvasToolbar.displayName = 'CanvasToolbar';

/** @type {MuiSx} */
const canvasToolbarStyles = isCompact => ({
  root: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '0.25rem',
    marginBottom: '1rem',
    paddingX: isCompact ? '0.5rem' : undefined,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  extraActionsWrapper: {
    display: 'flex',
    alignItems: 'center',
  },
});

export default CanvasToolbar;
