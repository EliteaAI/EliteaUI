import { memo, useMemo } from 'react';

import { Box } from '@mui/material';

import { AgentInput } from '@/[fsd]/features/agent/ui/agent-details/configurations';
import ApplicationAdvanceSettings from '@/[fsd]/features/agent/ui/agent-details/configurations/ApplicationAdvanceSettings';
import ApplicationEditorNotes from '@/[fsd]/features/agent/ui/agent-details/configurations/ApplicationEditorNotes';
import PipelineToolsSection from '@/[fsd]/features/pipelines/tool-picker/ui/PipelineToolsSection';
import { ViewMode } from '@/common/constants.js';
import ConversationStarters from '@/components/ConversationStarters';
import ApplicationEditForm from '@/pages/Applications/Components/Applications/ApplicationEditForm';
import ApplicationInformation from '@/pages/Applications/Components/Applications/ApplicationInformation';

// PipelineToolsSection by file: the tool-picker barrel also exports the node pickers, which reach this form back

const PipelineConfigurationForm = memo(props => {
  const { viewMode, containerStyle = {}, isChatView = false, isCreateMode = false, onSelectNode } = props;
  const isDisabled = viewMode !== ViewMode.Owner;

  const styles = useMemo(() => pipelineConfigurationFormStyles(isChatView), [isChatView]);

  return (
    <Box sx={containerStyle}>
      {!isChatView && <ApplicationEditForm />}
      <PipelineToolsSection
        style={styles.applicationTools}
        disabled={isDisabled}
        onSelectNode={onSelectNode}
      />
      {!isDisabled && (
        <>
          <AgentInput.WelcomeMessageInput />
          <ConversationStarters
            disabled={isDisabled}
            style={styles.conversationStarters}
          />
        </>
      )}
      <ApplicationAdvanceSettings
        style={styles.advanceSettings}
        disabled={isDisabled}
        stepLimitTestId="pipeline-step-limit-input"
      />
      <ApplicationEditorNotes
        style={styles.editorNotes}
        disabled={isDisabled}
        sectionTestId="pipeline-editor-notes-section"
        notesInputTestId="pipeline-editor-notes-input"
      />
      {!isCreateMode && (
        <ApplicationInformation
          style={styles.information}
          showPipeline
        />
      )}
    </Box>
  );
});

PipelineConfigurationForm.displayName = 'PipelineConfigurationForm';

/** @type {MuiSx} */
const pipelineConfigurationFormStyles = isChatView => ({
  applicationTools: {
    marginTop: !isChatView ? '1rem' : 0,
  },
  conversationStarters: {
    marginTop: '1rem',
  },
  advanceSettings: {
    marginTop: '1rem',
  },
  editorNotes: {
    marginTop: '1rem',
  },
  information: {
    marginTop: '1rem',
  },
});

export default PipelineConfigurationForm;
