import { memo, useCallback, useRef } from 'react';

import { Box } from '@mui/material';

import { PIPELINE_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours/lib/constants';
import { usePipelineAttachmentYamlSync } from '@/[fsd]/features/pipelines/lib/hooks';
import { useIsSmallWindow } from '@/[fsd]/shared/lib/hooks';
import EditorPanel from '@/pages/Pipelines/Components/EditorPanel';
import GeneralFormPanel from '@/pages/Pipelines/Components/GeneralFormPanel';

const UNSAVED_TEST_REASON = 'Save the pipeline to test it';

const noop = () => {};

const PipelineEditorWorkspace = memo(() => {
  const editorPanelRef = useRef();

  usePipelineAttachmentYamlSync();

  const fitView = useCallback(() => {
    setTimeout(() => {
      editorPanelRef.current?.fitView?.();
    }, 0);
  }, []);

  const { isSmallWindow } = useIsSmallWindow(fitView);

  const styles = pipelineEditorWorkspaceStyles(isSmallWindow);

  return (
    <Box
      sx={styles.root}
      data-tour={PIPELINE_TOUR_TARGET_IDS.workspace}
    >
      <GeneralFormPanel
        isCreateMode
        onCollapsed={fitView}
      />
      <EditorPanel
        ref={editorPanelRef}
        setYamlDirty={noop}
        stopRun={noop}
        onTestPipeline={noop}
        testDisabledReason={UNSAVED_TEST_REASON}
        sx={styles.editorPanel}
      />
    </Box>
  );
});

PipelineEditorWorkspace.displayName = 'PipelineEditorWorkspace';

/** @type {MuiSx} */
const pipelineEditorWorkspaceStyles = isSmallWindow => ({
  root: {
    display: 'flex',
    flexDirection: isSmallWindow ? 'column' : 'row',
    gap: '2rem',
    width: '100%',
    height: 'calc(100vh - 3.8125rem)',
    padding: '0.75rem 1.5rem 1.5rem',
    boxSizing: 'border-box',
    overflow: isSmallWindow ? 'auto' : 'hidden',
  },
  editorPanel: {
    flex: 1,
    minWidth: 0,
    minHeight: isSmallWindow ? 'calc(100vh - 13.75rem)' : '100%',
  },
});

export default PipelineEditorWorkspace;
