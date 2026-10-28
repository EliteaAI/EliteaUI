import { memo, useMemo } from 'react';

import { Box } from '@mui/material';

import { FlowEditorAddNode, FlowEditorTestPipeline } from '@/[fsd]/features/pipelines/flow-editor/ui';
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
        {isFlowMode && (
          <FlowEditorAddNode.AddNodeButton
            onAddNode={onAddNode}
            disabled={disabled}
          />
        )}
        {onTestPipeline && (
          <FlowEditorTestPipeline.TestPipelineButton
            onClick={onTestPipeline}
            disabledReason={testDisabledReason}
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
});

export default CanvasToolbar;
