import React, { memo, useCallback, useMemo, useRef, useState } from 'react';

import { useFormikContext } from 'formik';

import { useTrackEvent } from '@/GA';
import { InstructionsInputRefProvider } from '@/[fsd]/app/providers';
import CreateAgentForm from '@/[fsd]/features/agent/ui/agent-details/configurations/form/CreateAgentForm';
import { useConversationStartersSync } from '@/[fsd]/features/chat/lib/hooks';
import useRefetchAgentVersionDetailsOnClose from '@/[fsd]/features/chat/lib/hooks/useRefetchAgentVersionDetailsOnClose';
import { GA_EVENT_NAMES, GA_EVENT_PARAMS } from '@/[fsd]/shared/lib/constants/analytic.constants';
import { useGetApplicationVersionDetailQuery, usePublicApplicationDetailsQuery } from '@/api/applications';
import { ChatParticipantType, PERMISSIONS, PUBLIC_PROJECT_ID, ViewMode } from '@/common/constants.js';
import useCheckPermission from '@/hooks/useCheckPermission';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import ApplicationConfigurationForm from '@/pages/Applications/Components/Applications/ApplicationConfigurationForm';
import getValidateSchema from '@/pages/Applications/Components/Applications/ApplicationCreationValidateSchema';
import ApplicationValidator from '@/pages/Applications/Components/Applications/ApplicationValidator';
import CreateApplicationSaveButton from '@/pages/Applications/Components/Applications/CreateApplicationSaveButton';
import SaveApplicationButton from '@/pages/Applications/Components/Applications/SaveApplicationButton.jsx';
import { useCreateApplicationInitialValues } from '@/pages/Applications/useApplicationInitialValues';
import { ContentContainer } from '@/pages/Common/Components/StyledComponents.jsx';
import BaseEditor from '@/pages/NewChat/components/BaseEditor.jsx';
import LLMModelSelectorWrapper from '@/pages/NewChat/components/LLMModelSelectorWrapper';

const getAgentId = agent => {
  // agent is a chat participant with entity_meta structure
  return agent?.entity_meta?.id || agent?.id || agent?.meta?.id;
};

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
  } = props;
  const { setFieldValue } = useFormikContext();

  useConversationStartersSync(onConversationStartersChange);
  const styles = getStyles();

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
            disabled={!canEditIt}
            modelTooltip={isPublic ? 'Model configuration is locked for Public agents' : undefined}
            settingsTooltip={isPublic ? 'Model settings are locked for Public agents' : undefined}
          />
        )}
        {isCreateMode ? (
          <CreateAgentForm sx={styles.createForm} />
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

const AgentEditor = memo(
  ({
    agent,
    versionName,
    onCloseAgentEditor,
    isVisible,
    isCreateMode = false,
    onAgentCreated,
    onAgentSaved,
    onAttachmentToolChange,
    onAgentDirtyStateChange,
    onConversationStartersChange,
  }) => {
    const trackEvent = useTrackEvent();

    // State for dirty tracking
    const [isDirty, setIsDirty] = useState(false);
    const { checkPermission } = useCheckPermission();
    const hasEditPermission = useMemo(() => {
      return checkPermission(PERMISSIONS.applications.update);
    }, [checkPermission]);
    // For chat context, always use ViewMode.Owner to enable editing
    const isPublic = agent?.entity_meta?.project_id === PUBLIC_PROJECT_ID;
    const canEditIt = !isPublic && hasEditPermission;
    const viewMode = canEditIt ? ViewMode.Owner : ViewMode.Public;
    const projectId = useSelectedProjectId();
    const agentId = getAgentId(agent);
    const versionId = agent?.entity_settings?.version_id;

    // Get standard initial values for create mode
    const { initialValues: createInitialValues } = useCreateApplicationInitialValues();

    // Only fetch details when the editor is visible and we have required IDs (edit mode only)
    const isPublishedAgent = agent?.entity_meta?.project_id == PUBLIC_PROJECT_ID;
    const {
      data: privateVersionDetails,
      error: privateError,
      refetch: refetchPrivateVersionDetails,
    } = useGetApplicationVersionDetailQuery(
      projectId && agentId && versionId && isVisible && !isCreateMode && !isPublishedAgent
        ? { projectId: agent.entity_meta?.project_id || projectId, applicationId: agentId, versionId }
        : { skip: true },
      { skip: !isVisible || !projectId || !agentId || !versionId || isCreateMode || isPublishedAgent },
    );
    const {
      data: publicAppDetails,
      error: publicError,
      refetch: refetchPublicAppDetails,
    } = usePublicApplicationDetailsQuery(
      { applicationId: agentId, versionName },
      { skip: !isVisible || !agentId || !isPublishedAgent || isCreateMode },
    );
    const versionDetails = isPublishedAgent ? publicAppDetails : privateVersionDetails;
    const error = isPublishedAgent ? publicError : privateError;
    const refetchVersionDetails = isPublishedAgent ? refetchPublicAppDetails : refetchPrivateVersionDetails;
    const { refetchAgentVersionDetailsOnClose } = useRefetchAgentVersionDetailsOnClose({
      refetchVersionDetails,
    });

    // Transform API response to agent participant format for chat context
    const handleAgentCreated = useCallback(
      result => {
        if (result && onAgentCreated) {
          const createdAgent = {
            participantType: ChatParticipantType.Applications,
            ...result,
          };

          onAgentCreated(createdAgent);
        }
      },
      [onAgentCreated],
    );

    const fileReaderEnhancerRef = useRef();

    // Prepare initialValues for Formik
    const initialValues = useMemo(() => {
      // Create mode: use standard initial values
      if (isCreateMode) {
        return createInitialValues;
      }

      // Edit mode: validate version details to prevent using stale cached data
      if (versionDetails) {
        const currentVersionId = versionDetails.version_details?.id || versionDetails.id;
        const isValidVersion = currentVersionId === versionId;

        if (isValidVersion) {
          // Valid version details - use them for form initialization
          const applicationName = agent?.meta?.name || agent?.name || '';

          if (versionDetails.version_details) {
            return {
              ...versionDetails,
              id: agentId,
              name: applicationName,
              llm_settings: versionDetails.version_details.llm_settings,
            };
          }

          return {
            ...versionDetails,
            id: agentId,
            name: applicationName,
            version_details: {
              ...versionDetails,
              llm_settings: versionDetails.llm_settings,
            },
          };
        }
        // If version doesn't match, fall through to fallback
      }

      // Fallback: return basic structure while waiting for correct version data
      if (agent && agentId) {
        return {
          id: agentId,
          name: agent?.meta?.name || agent?.name || '',
          description: '', // Will be populated when API data loads
          version_details: {
            instructions: '',
            llm_settings: {
              model_name: '',
              model_project_id: projectId,
              temperature: 0.7,
              max_tokens: 4096,
              // Note: reasoning_effort will be added by LLMSettings component if model supports it
            },
            variables: agent?.entity_settings?.variables || [],
            conversation_starters: [],
            tags: [],
            tools: [],
            welcome_message: '',
            meta: {
              icon_meta: agent?.entity_settings?.icon_meta || null,
            },
          },
        };
      }

      return {};
    }, [isCreateMode, versionDetails, agent, agentId, createInitialValues, versionId, projectId]);

    const handleDiscard = useCallback(() => {
      // Reset the form to initial values
      fileReaderEnhancerRef.current?.restoreValue(initialValues?.version_details?.instructions || '');
    }, [initialValues?.version_details?.instructions]);

    const onClose = useCallback(() => {
      onCloseAgentEditor?.();
      refetchAgentVersionDetailsOnClose();
    }, [onCloseAgentEditor, refetchAgentVersionDetailsOnClose]);

    // Handle successful save
    const handleSaveSuccess = useCallback(
      savedFormData => {
        if (onAgentSaved && savedFormData) {
          trackEvent(GA_EVENT_NAMES.AGENT_MODIFIED_FROM_CHAT, {
            [GA_EVENT_PARAMS.ENTITY]: 'agent',
            [GA_EVENT_PARAMS.AGENT_ID]: agentId,
            [GA_EVENT_PARAMS.AGENT_NAME]: savedFormData.name || 'unknown',
            [GA_EVENT_PARAMS.MODIFICATION_TYPE]: 'config_update',
            [GA_EVENT_PARAMS.TIMESTAMP]: new Date().toISOString(),
          });
          onAgentSaved(savedFormData);
        }
      },
      [onAgentSaved, trackEvent, agentId],
    );

    const handleAttachmentToolChange = useCallback(() => {
      onAttachmentToolChange?.(agent?.id);
      // Refetch agent details to get updated attachment/tool configuration
      if (refetchVersionDetails && !isCreateMode) {
        refetchVersionDetails();
      }
    }, [onAttachmentToolChange, agent?.id, refetchVersionDetails, isCreateMode]);

    // Early return null when agent is null and not in create mode
    if (!agent && !isCreateMode) {
      return null;
    }

    const editorTitle = isCreateMode
      ? 'Create New Agent'
      : agent?.meta?.name || agent?.name || 'Unnamed Agent';
    const editorSubtitle = isCreateMode ? '' : initialValues?.version_details?.name;

    return (
      <InstructionsInputRefProvider inputRef={fileReaderEnhancerRef}>
        <BaseEditor
          isVisible={isVisible}
          isDirty={isDirty}
          setIsDirty={setIsDirty}
          onClose={onClose}
          title={editorTitle}
          subtitle={editorSubtitle}
          onDiscard={handleDiscard}
          initialValues={initialValues}
          validationSchema={getValidateSchema}
          error={error}
          onDirtyStateChange={onAgentDirtyStateChange}
          saveButton={
            isCreateMode ? (
              <CreateApplicationSaveButton onSuccess={handleAgentCreated} />
            ) : (
              <SaveApplicationButton onSuccess={handleSaveSuccess} />
            )
          }
          isPublic={!canEditIt}
        >
          <AgentEditorContent
            agentId={agentId}
            projectId={projectId}
            isCreateMode={isCreateMode}
            canEditIt={canEditIt && !isPublic}
            viewMode={viewMode}
            handleAttachmentToolChange={handleAttachmentToolChange}
            isPublic={isPublic}
            onConversationStartersChange={onConversationStartersChange}
            entityProjectId={agent?.entity_meta?.project_id}
          />
        </BaseEditor>
      </InstructionsInputRefProvider>
    );
  },
);

AgentEditor.displayName = 'AgentEditor';

/**
 * @type {MuiSx}
 */
const getStyles = () => ({
  createForm: {
    margin: '0 auto',
    maxWidth: '100%',
  },
  configForm: {
    width: '100%',
  },
});

export default AgentEditor;
