import { memo, useMemo } from 'react';

import { Box } from '@mui/material';

import { ApplicationTools } from '@/[fsd]/features/agent/ui/agent-details/configurations';
import { ViewMode } from '@/common/constants.js';
import ApplicationAdvanceSettings from '@/components/ApplicationAdvanceSettings';
import ConversationStarters from '@/components/ConversationStarters';
import ApplicationEditForm from '@/pages/Applications/Components/Applications/ApplicationEditForm';
import ApplicationInformation from '@/pages/Applications/Components/Applications/ApplicationInformation';
import ApplicationWelcomeMessage from '@/pages/Applications/Components/Applications/ApplicationWelcomeMessage';

const PipelineConfigurationForm = memo(props => {
  const {
    applicationId,
    viewMode,
    containerStyle = {},
    isChatView = false,
    hidePythonSandbox,
    onAttachmentToolChange,
  } = props;
  const isDisabled = viewMode !== ViewMode.Owner;

  const styles = useMemo(() => pipelineConfigurationFormStyles(isChatView), [isChatView]);

  return (
    <Box sx={containerStyle}>
      {!isChatView && <ApplicationEditForm />}
      <ApplicationTools
        title={'Toolkits'}
        style={styles.applicationTools}
        applicationId={applicationId}
        disabled={isDisabled}
        hidePythonSandbox={hidePythonSandbox}
        onAttachmentToolChange={onAttachmentToolChange}
      />
      {!isDisabled && (
        <>
          <ApplicationWelcomeMessage />
          <ConversationStarters
            disabled={isDisabled}
            style={styles.conversationStarters}
          />
        </>
      )}
      <ApplicationAdvanceSettings
        style={styles.advanceSettings}
        disabled={isDisabled}
      />
      <ApplicationInformation
        style={styles.information}
        showPipeline
      />
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
  information: {
    marginTop: '1rem',
  },
});

export default PipelineConfigurationForm;
