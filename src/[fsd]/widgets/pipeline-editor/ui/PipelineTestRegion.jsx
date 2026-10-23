import { forwardRef, memo } from 'react';

import { TestPanelUI, usePipelineTestChat, useTestPanelWidth } from '@/[fsd]/features/pipelines/test-panel';
import useAgentMCPToolsStatusMonitor from '@/hooks/application/useAgentMCPToolsStatusMonitor';

/**
 * Edit-only right region of the pipeline editor: resize handle + Test panel with its chat state.
 */
const PipelineTestRegion = memo(
  forwardRef((props, ref) => {
    const {
      applicationId,
      isOpen,
      onClose,
      onResized,
      isSmallWindow,
      editorPanelRef,
      workspaceRef,
      unsavedLLMSettings,
      setUnsavedLLMSettings,
    } = props;

    useAgentMCPToolsStatusMonitor();

    const { settings, setActiveConversation, goToRunHistory } = usePipelineTestChat({
      applicationId,
      editorPanelRef,
      unsavedLLMSettings,
      setUnsavedLLMSettings,
    });

    const { containerRef, width, handleResizeStart } = useTestPanelWidth({ workspaceRef, onResized });

    return (
      <TestPanelUI.TestPanel
        ref={ref}
        panelRef={containerRef}
        isOpen={isOpen}
        width={width}
        isFullWidth={isSmallWindow}
        settings={settings}
        setActiveConversation={setActiveConversation}
        editorPanelRef={editorPanelRef}
        onShowHistory={goToRunHistory}
        onClose={onClose}
        resizeHandle={
          !isSmallWindow && <TestPanelUI.TestPanelResizeHandle onResizeStart={handleResizeStart} />
        }
      />
    );
  }),
);

PipelineTestRegion.displayName = 'PipelineTestRegion';

export default PipelineTestRegion;
