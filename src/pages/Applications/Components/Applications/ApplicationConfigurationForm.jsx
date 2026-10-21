import { memo, useMemo } from 'react';

import { useFormikContext } from 'formik';

import { Box } from '@mui/material';

import { AgentInput, ApplicationTools } from '@/[fsd]/features/agent/ui/agent-details/configurations';
import ApplicationAdvanceSettings from '@/[fsd]/features/agent/ui/agent-details/configurations/ApplicationAdvanceSettings';
import ApplicationEditorNotes from '@/[fsd]/features/agent/ui/agent-details/configurations/ApplicationEditorNotes';
import { ApplicationSkills } from '@/[fsd]/features/skill/ui';
import { EntitySchedulesSection } from '@/[fsd]/widgets/entity-schedules-section';
import { ViewMode } from '@/common/constants.js';
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
  // The saved name, not an unsaved edit, names the entity chip on the Schedules page
  const { initialValues } = useFormikContext();

  const isDisabled = useMemo(() => viewMode !== ViewMode.Owner, [viewMode]);
  const styles = useMemo(() => applicationConfigurationFormStyles(isChatView), [isChatView]);

  return (
    <Box sx={{ ...styles.container, ...containerStyle }}>
      {!isChatView && <ApplicationEditForm />}
      <AgentInput.InstructionsInput
        style={styles.contextSection}
        disabled={isDisabled}
        applicationId={applicationId}
        entityProjectId={entityProjectId}
      />
      <ApplicationVariables
        style={styles.section}
        sectionTestId="agent-variables-section"
        rowTestId="agent-variable-row-{}"
        inputTestId="agent-variable-input-{}"
      />
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
      <ApplicationSkills
        style={styles.section}
        disabled={isDisabled}
        entityProjectId={entityProjectId}
      />
      <ConversationStarters
        disabled={isDisabled}
        style={styles.section}
      />
      <EntitySchedulesSection
        style={styles.section}
        entityType="agent"
        entityId={applicationId}
        entityName={initialValues?.name}
        isChatView={isChatView}
      />
      <ApplicationAdvanceSettings
        style={styles.section}
        disabled={isDisabled}
        showIgnoreProjectContext
      />
      <ApplicationEditorNotes
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
