import { memo, useMemo } from 'react';

import { Box, Tooltip } from '@mui/material';

import { FlowEditorAddNode, FlowEditorTestPipeline } from '@/[fsd]/features/pipelines/flow-editor/ui';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { PipelineEditorMode } from '@/common/constants';
import GroupedButton from '@/components/GroupedButton';
import CopyIcon from '@/components/Icons/CopyIcon';

const CanvasToolbar = memo(props => {
  const {
    mode,
    onModeChange,
    onAddNode,
    hasNodes,
    onTestPipeline,
    testDisabledReason,
    onCopyYaml,
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
        {!isFlowMode && (
          <Tooltip
            title="Copy yaml code to clipboard"
            placement="top"
          >
            <Box component="span">
              <Button.BaseBtn
                variant={BUTTON_VARIANTS.tertiary}
                startIcon={<CopyIcon sx={styles.copyIcon} />}
                onClick={onCopyYaml}
                aria-label="Copy yaml code to clipboard"
                data-testid="pipeline-yaml-copy-button"
              />
            </Box>
          </Tooltip>
        )}
        {onTestPipeline && (
          <FlowEditorTestPipeline.TestPipelineButton
            onClick={onTestPipeline}
            hasNodes={hasNodes}
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
  copyIcon: {
    fontSize: '1rem',
  },
});

export default CanvasToolbar;
