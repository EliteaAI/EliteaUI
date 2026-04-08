import { forwardRef } from 'react';

import { FlowEditor } from '@/[fsd]/features/pipelines/flow-editor/ui';
import { PipelineEditorMode } from '@/common/constants.js';
import useIsSmallWindow from '@/hooks/useIsSmallWindow';
import { ReactFlowProvider } from '@xyflow/react';

const FlowWrapper = forwardRef(({ stopRun, mode, setYamlJsonObject, noBorder = false, disabled }, ref) => {
  const { isSmallWindow } = useIsSmallWindow();

  const styles = flowWrapperStyles();

  return (
    <ReactFlowProvider>
      <FlowEditor
        ref={ref}
        setYamlJsonObject={setYamlJsonObject}
        sx={styles.flowEditor(isSmallWindow, noBorder, mode)}
        stopRun={stopRun}
        disabled={disabled}
      />
    </ReactFlowProvider>
  );
});

FlowWrapper.displayName = 'FlowWrapper';

/** @type {() => MuiSx} */
const flowWrapperStyles = () => ({
  flowEditor: (isSmallWindow, noBorder, mode) => ({
    width: '100%',
    minHeight: isSmallWindow ? 'calc(100vh - 220px)' : undefined,
    height: 'calc(100% - 40px)',
    flex: 1,
    border: ({ palette }) => (noBorder ? 'none' : `1px solid ${palette.border.lines}`),
    borderTop: ({ palette }) => (noBorder ? `1px solid ${palette.border.lines}` : undefined),
    borderRadius: noBorder ? '0' : '8px',
    overflow: 'hidden',
    display: mode === PipelineEditorMode.Flow ? undefined : 'none',
  }),
});

export default FlowWrapper;
