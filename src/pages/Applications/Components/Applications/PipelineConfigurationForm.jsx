import { memo, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { AgentInput, ApplicationTools } from '@/[fsd]/features/agent/ui/agent-details/configurations';
import { AttachmentSwitch } from '@/[fsd]/features/agent/ui/agent-details/configurations/switch';
import { ViewMode } from '@/common/constants.js';
import ApplicationAdvanceSettings from '@/components/ApplicationAdvanceSettings';
import ConversationStarters from '@/components/ConversationStarters';
import ApplicationEditForm from '@/pages/Applications/Components/Applications/ApplicationEditForm';
import ApplicationInformation from '@/pages/Applications/Components/Applications/ApplicationInformation';

const PipelineConfigurationForm = memo(props => {
  const {
    applicationId,
    viewMode,
    containerStyle = {},
    isChatView = false,
    hidePythonSandbox,
    onAttachmentToolChange,
    entityProjectId,
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
        entityProjectId={entityProjectId}
      />
      <Box sx={styles.internalToolsSection}>
        <Typography sx={styles.internalToolsLabel}>INTERNAL TOOLS</Typography>
        <AttachmentSwitch disabled={isDisabled} />
      </Box>
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
  internalToolsSection: {
    marginTop: '1rem',
    padding: '0.75rem 1rem',
  },
  internalToolsLabel: ({ palette }) => ({
    fontSize: '0.75rem',
    fontWeight: 500,
    lineHeight: '1rem',
    marginBottom: '0.75rem',
    color: palette.text.secondary,
  }),
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
