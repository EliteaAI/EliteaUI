import { memo, useCallback } from 'react';

import { useFormikContext } from 'formik';

import { Box } from '@mui/material';

import { useConversationStartersSync } from '@/[fsd]/features/chat/lib/hooks';
import LLMModelSelectorWrapper from '@/[fsd]/features/chat/ui/editors/LLMModelSelectorWrapper';
import PipelineConfigurationForm from '@/pages/Applications/Components/Applications/PipelineConfigurationForm.jsx';

const PipelineEditorContent = memo(props => {
  const {
    viewMode,
    canEditIt,
    isPublic,
    pipelineId,
    projectId,
    handleAttachmentToolChange,
    entityProjectId,
    onConversationStartersChange,
    isCreateMode,
  } = props;
  const { setFieldValue } = useFormikContext();
  const styles = pipelineEditorContentStyles();

  useConversationStartersSync(onConversationStartersChange);

  // LLM Settings setter for the modal dialog
  const onLLMSettingsChange = useCallback(
    newSettings => {
      // Update each setting individually
      Object.entries(newSettings).forEach(([key, value]) => {
        setFieldValue(`version_details.llm_settings.${key}`, value);
      });
    },
    [setFieldValue],
  );

  return (
    <Box>
      <LLMModelSelectorWrapper
        projectId={projectId}
        onLLMSettingsChange={onLLMSettingsChange}
        disabled={!canEditIt}
        modelTooltip={isPublic ? 'Model configuration is locked for Public agents' : undefined}
        settingsTooltip={isPublic ? 'Model settings are locked for Public agents' : undefined}
      />
      {!isCreateMode && (
        <PipelineConfigurationForm
          applicationId={pipelineId}
          viewMode={viewMode}
          isChatView
          containerStyle={styles.configForm}
          hidePythonSandbox
          onAttachmentToolChange={handleAttachmentToolChange}
          entityProjectId={entityProjectId}
        />
      )}
    </Box>
  );
});

PipelineEditorContent.displayName = 'PipelineEditorContent';

/** @type {MuiSx} */
const pipelineEditorContentStyles = () => ({
  configForm: {
    paddingBottom: 0,
  },
});

export default PipelineEditorContent;
