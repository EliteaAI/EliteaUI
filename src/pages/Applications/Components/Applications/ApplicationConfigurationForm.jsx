import { memo, useMemo } from 'react';

import { Box } from '@mui/material';

import { AgentInput, ApplicationTools } from '@/[fsd]/features/agent/ui/agent-details/configurations';
import { ViewMode } from '@/common/constants.js';
import ApplicationAdvanceSettings from '@/components/ApplicationAdvanceSettings';
import ApplicationVariables from '@/components/ApplicationVariables.jsx';
import ConversationStarters from '@/components/ConversationStarters';
import ApplicationEditForm from '@/pages/Applications/Components/Applications/ApplicationEditForm';
import ApplicationInformation from '@/pages/Applications/Components/Applications/ApplicationInformation';

const ApplicationConfigurationForm = memo(props => {
  const {
    applicationId,
    viewMode,
    containerStyle = {},
    isChatView = false,
    onAttachmentToolChange,
    entityProjectId,
  } = props;

  const isDisabled = useMemo(() => viewMode !== ViewMode.Owner, [viewMode]);
  const styles = useMemo(() => applicationConfigurationFormStyles(isChatView), [isChatView]);

  return (
    <Box sx={{ ...styles.container, ...containerStyle }}>
      {!isChatView && <ApplicationEditForm />}
      <AgentInput.InstructionsInput
        style={styles.contextSection}
        disabled={isDisabled}
      />
      <ApplicationVariables style={styles.section} />
      <AgentInput.WelcomeMessageInput
        style={styles.section}
        disabled={isDisabled}
      />
      <ApplicationTools
        style={styles.section}
        applicationId={applicationId}
        disabled={isDisabled}
        onAttachmentToolChange={onAttachmentToolChange}
        entityProjectId={entityProjectId}
      />
      <ConversationStarters
        disabled={isDisabled}
        style={styles.section}
      />
      <ApplicationAdvanceSettings
        style={styles.section}
        disabled={isDisabled}
      />
      <ApplicationInformation style={styles.section} />
    </Box>
  );
});

ApplicationConfigurationForm.displayName = 'ApplicationConfigurationForm';

/** @type {MuiSx} */
const applicationConfigurationFormStyles = isChatView => ({
  container: {
    paddingBottom: '1.25rem',
  },
  contextSection: {
    marginTop: !isChatView ? '1.5rem' : '0',
  },
  section: {
    marginTop: '1rem',
  },
});

export default ApplicationConfigurationForm;
