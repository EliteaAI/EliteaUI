import { memo, useCallback, useRef, useState } from 'react';

import { useLocation } from 'react-router-dom';

import { Box } from '@mui/material';

import { PIPELINE_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours/lib/constants';
import { usePipelineAttachmentYamlSync } from '@/[fsd]/features/pipelines/lib/hooks';
import { useIsSmallWindow } from '@/[fsd]/shared/lib/hooks';
import EditorPanel from '@/pages/Pipelines/Components/EditorPanel';
import GeneralFormPanel from '@/pages/Pipelines/Components/GeneralFormPanel';

import PipelineTestRegion from './PipelineTestRegion';

const UNSAVED_TEST_REASON = 'Save the pipeline to test it';

const noop = () => {};

/**
 * Pipeline editor layout. Create mode (no `applicationId`): form + full-width canvas.
 * Edit mode: adds the Test panel, closed by default unless a Run History restore is pending.
 */
const PipelineEditorWorkspace = memo(props => {
  const { applicationId, setYamlDirty = noop, unsavedLLMSettings, setUnsavedLLMSettings } = props;
  const isEditMode = Boolean(applicationId);

  const location = useLocation();
  const editorRowRef = useRef();
  const editorPanelRef = useRef();
  const testPanelRef = useRef();
  const [isTestPanelOpen, setIsTestPanelOpen] = useState(
    () => isEditMode && Boolean(location.state?.restoredConversationID),
  );

  usePipelineAttachmentYamlSync();

  const fitView = useCallback(() => {
    setTimeout(() => {
      editorPanelRef.current?.fitView?.();
    }, 0);
  }, []);

  const { isSmallWindow } = useIsSmallWindow(fitView);

  // Opening or closing the Test panel keeps the canvas zoom and position as they are
  const handleOpenTestPanel = useCallback(() => {
    setIsTestPanelOpen(true);
  }, []);

  const handleCloseTestPanel = useCallback(() => {
    setIsTestPanelOpen(false);
  }, []);

  const handleSelectNode = useCallback(nodeId => {
    editorPanelRef.current?.selectNode?.(nodeId);
  }, []);

  const handleStopRun = useCallback(() => {
    testPanelRef.current?.stopRun();
  }, []);

  const styles = pipelineEditorWorkspaceStyles(isSmallWindow);

  return (
    <Box
      sx={styles.root}
      data-tour={PIPELINE_TOUR_TARGET_IDS.workspace}
    >
      <GeneralFormPanel
        applicationId={applicationId}
        isCreateMode={!isEditMode}
        onCollapsed={fitView}
        onSelectNode={handleSelectNode}
      />
      <Box
        ref={editorRowRef}
        sx={styles.editorRow}
      >
        <EditorPanel
          ref={editorPanelRef}
          setYamlDirty={setYamlDirty}
          stopRun={isEditMode ? handleStopRun : noop}
          onTestPipeline={isEditMode ? handleOpenTestPanel : noop}
          testDisabledReason={isEditMode ? '' : UNSAVED_TEST_REASON}
          isTestPanelOpen={isTestPanelOpen}
          sx={styles.editorPanel}
        />
        {isEditMode && (
          <PipelineTestRegion
            ref={testPanelRef}
            applicationId={applicationId}
            isOpen={isTestPanelOpen}
            onClose={handleCloseTestPanel}
            onResized={fitView}
            isSmallWindow={isSmallWindow}
            editorPanelRef={editorPanelRef}
            workspaceRef={editorRowRef}
            unsavedLLMSettings={unsavedLLMSettings}
            setUnsavedLLMSettings={setUnsavedLLMSettings}
          />
        )}
      </Box>
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
  editorRow: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: isSmallWindow ? 'column' : 'row',
    gap: '1.5rem',
  },
  editorPanel: {
    flex: 1,
    minWidth: 0,
    minHeight: isSmallWindow ? 'calc(100vh - 13.75rem)' : '100%',
  },
});

export default PipelineEditorWorkspace;
