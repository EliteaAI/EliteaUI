import React, { memo, useCallback, useMemo, useRef, useState } from 'react';

import { useTrackEvent } from '@/GA';
import { useRefetchAgentVersionDetailsOnClose } from '@/[fsd]/features/chat/lib/hooks/useRefetchAgentVersionDetailsOnClose.hooks';
import AgentEditorContent from '@/[fsd]/features/chat/ui/editors/AgentEditorContent';
import BaseEditor from '@/[fsd]/features/chat/ui/editors/BaseEditor.jsx';
import { AnalyticConstants } from '@/[fsd]/shared/lib/constants';
import { InstructionsInputRefProvider } from '@/[fsd]/shared/lib/context';
import { useGetApplicationVersionDetailQuery, usePublicApplicationDetailsQuery } from '@/api/applications';
import { ChatParticipantType, PERMISSIONS, PUBLIC_PROJECT_ID, ViewMode } from '@/common/constants.js';
import useCheckPermission from '@/hooks/useCheckPermission';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import getValidateSchema from '@/pages/Applications/Components/Applications/ApplicationCreationValidateSchema';
import CreateApplicationSaveButton from '@/pages/Applications/Components/Applications/CreateApplicationSaveButton';
import SaveApplicationButton from '@/pages/Applications/Components/Applications/SaveApplicationButton.jsx';
import { useCreateApplicationInitialValues } from '@/pages/Applications/useApplicationInitialValues';

const { GA_EVENT_NAMES, GA_EVENT_PARAMS } = AnalyticConstants;

const getAgentId = agent => {
  // agent is a chat participant with entity_meta structure
  return agent?.entity_meta?.id || agent?.id || agent?.meta?.id;
};

const AgentEditor = memo(props => {
  const {
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
    // Callback to save per-conversation LLM override for published public agents
    onConversationLlmOverride,
    disableNavBlocking = false,
  } = props;

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
        // For public agents, display any per-conversation LLM override in the model selector
        const entityLlmOverride = isPublishedAgent ? (agent?.entity_settings?.llm_settings ?? null) : null;

        if (versionDetails.version_details) {
          const baseLlmSettings = versionDetails.version_details.llm_settings;
          return {
            ...versionDetails,
            id: agentId,
            name: applicationName,
            llm_settings: entityLlmOverride || baseLlmSettings,
            version_details: {
              ...versionDetails.version_details,
              llm_settings: entityLlmOverride || baseLlmSettings,
            },
          };
        }

        return {
          ...versionDetails,
          id: agentId,
          name: applicationName,
          version_details: {
            ...versionDetails,
            llm_settings: entityLlmOverride || versionDetails.llm_settings,
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
  }, [
    isCreateMode,
    versionDetails,
    agent,
    agentId,
    createInitialValues,
    versionId,
    projectId,
    isPublishedAgent,
  ]);

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

  const editorTitle = isCreateMode ? 'Create New Agent' : agent?.meta?.name || agent?.name || 'Unnamed Agent';
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
        disableNavBlocking={disableNavBlocking}
        saveButton={
          isCreateMode ? (
            <CreateApplicationSaveButton
              data-testid="agent-save-button"
              onSuccess={handleAgentCreated}
            />
          ) : (
            <SaveApplicationButton
              onSuccess={handleSaveSuccess}
              isAgent
            />
          )
        }
        isPublic={!canEditIt}
        titleTestId="agent-canvas-title"
        subtitleTestId="agent-canvas-subtitle"
        closeButtonTestId="agent-canvas-close-button"
        publicLabelTestId="agent-canvas-public-label"
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
          onPublicLlmOverride={isPublic && onConversationLlmOverride ? onConversationLlmOverride : undefined}
          onAgentCreated={isCreateMode ? handleAgentCreated : undefined}
        />
      </BaseEditor>
    </InstructionsInputRefProvider>
  );
});

AgentEditor.displayName = 'AgentEditor';

export default AgentEditor;
