import { memo, useCallback } from 'react';

import { useFormikContext } from 'formik';

import { CreateAgentForm } from '@/[fsd]/features/agent/ui';
import { useConversationStartersSync } from '@/[fsd]/features/chat/lib/hooks';
import LLMModelSelectorWrapper from '@/[fsd]/features/chat/ui/editors/LLMModelSelectorWrapper';
import ApplicationConfigurationForm from '@/pages/Applications/Components/Applications/ApplicationConfigurationForm';
import ApplicationValidator from '@/pages/Applications/Components/Applications/ApplicationValidator';
import { ContentContainer } from '@/pages/Common/Components/StyledComponents.jsx';

const AgentEditorContent = memo(props => {
  const {
    agentId,
    projectId,
    isCreateMode,
    canEditIt,
    viewMode,
    handleAttachmentToolChange,
    isPublic,
    onConversationStartersChange,
    entityProjectId,
    // When provided, public-agent model changes save to entity_settings (per-conversation override)
    onPublicLlmOverride,
    onAgentCreated,
  } = props;
  const { setFieldValue } = useFormikContext();

  useConversationStartersSync(onConversationStartersChange);
  const styles = agentEditorContentStyles();

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

  // Model selector is enabled when user can edit the agent OR when a conversation override is available
  const canEditModel = canEditIt || !!onPublicLlmOverride;

  return (
    <>
      <ApplicationValidator
        agentId={agentId}
        projectId={entityProjectId || projectId}
        isCreateMode={isCreateMode}
      />
      <ContentContainer height="100%">
        {!isCreateMode && (
          <LLMModelSelectorWrapper
            projectId={projectId}
            onLLMSettingsChange={onLLMSettingsChange}
            disabled={!canEditModel}
            modelTooltip={
              isPublic && !onPublicLlmOverride ? 'Model configuration is locked for Public agents' : undefined
            }
            settingsTooltip={
              isPublic && !onPublicLlmOverride ? 'Model settings are locked for Public agents' : undefined
            }
            onPublicLlmOverride={onPublicLlmOverride}
          />
        )}
        {isCreateMode ? (
          <CreateAgentForm
            sx={styles.createForm}
            onAgentCreated={onAgentCreated}
          />
        ) : (
          <ApplicationConfigurationForm
            applicationId={agentId}
            containerStyle={styles.configForm}
            isChatView={true}
            viewMode={viewMode}
            onAttachmentToolChange={handleAttachmentToolChange}
            entityProjectId={entityProjectId}
          />
        )}
      </ContentContainer>
    </>
  );
});

AgentEditorContent.displayName = 'AgentEditorContent';

/** @type {MuiSx} */
const agentEditorContentStyles = () => ({
  createForm: {
    margin: '0 auto',
    maxWidth: '100%',
  },
  configForm: {
    width: '100%',
  },
});

export default AgentEditorContent;
