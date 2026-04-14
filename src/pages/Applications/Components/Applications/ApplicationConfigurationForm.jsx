import { memo, useMemo } from 'react';

import { Box } from '@mui/material';

import { ApplicationTools } from '@/[fsd]/features/agent/ui/agent-details/configurations';
import { ViewMode } from '@/common/constants.js';
import ApplicationAdvanceSettings from '@/components/ApplicationAdvanceSettings';
import ApplicationVariables from '@/components/ApplicationVariables.jsx';
import ConversationStarters from '@/components/ConversationStarters';
import ApplicationContext from '@/pages/Applications/Components/Applications/ApplicationContext';
import ApplicationEditForm from '@/pages/Applications/Components/Applications/ApplicationEditForm';
import ApplicationInformation from '@/pages/Applications/Components/Applications/ApplicationInformation';
import ApplicationWelcomeMessage from '@/pages/Applications/Components/Applications/ApplicationWelcomeMessage';

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
      <ApplicationContext
        style={styles.contextSection}
        disabled={isDisabled}
      />
      <ApplicationVariables style={styles.section} />
      <ApplicationWelcomeMessage
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
