import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { useTrackEvent } from '@/GA';
import { usePublicProjectAccessCheck } from '@/[fsd]/features/project/lib/hooks';
// TODO: DELETE after migration period (Q1 2026) - Legacy OpenAPI toolkit migration
import { LegacyOpenApiMigration } from '@/[fsd]/features/toolkits/lib/helpers';
import { useGetCurrentToolkitSchemas } from '@/[fsd]/features/toolkits/lib/hooks';
import { GA_EVENT_NAMES, GA_EVENT_PARAMS } from '@/[fsd]/shared/lib/constants/analytic.constants';
import { useCredentialWarning } from '@/[fsd]/shared/lib/hooks/useCredentialWarning';
import { CredentialWarningModal } from '@/[fsd]/shared/ui/modal/credential-warning';
import { useToolkitsDetailsQuery } from '@/api/toolkits';
import { PUBLIC_PROJECT_ID } from '@/common/constants';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import { CONFIGURATION_VIEW_OPTIONS } from '@/pages/Applications/Components/Tools/ToolConfigurationForm.jsx';
import { ContentContainer } from '@/pages/Common/Components/StyledComponents.jsx';
import BaseEditor from '@/pages/NewChat/components/BaseEditor.jsx';
import CreateToolkitButton from '@/pages/NewChat/components/CreateToolkitButton.jsx';
import SaveToolkitButton from '@/pages/Toolkits/SaveToolkitButton.jsx';
import ToolkitForm from '@/pages/Toolkits/ToolkitForm.jsx';
import ToolkitTypeSelector from '@/pages/Toolkits/ToolkitTypeSelector';
import { formatTitleFromSnakeCase } from '@/utils/stringUtils';

const getToolkitId = toolkit => {
  // toolkit is a chat participant with entity_meta structure
  return toolkit?.entity_meta?.id || toolkit?.id || toolkit?.meta?.id;
};

const ToolkitEditor = ({ toolkit, onCloseToolkitEditor, onToolkitCreated, onToolkitUpdated, isVisible }) => {
  const trackEvent = useTrackEvent();

  const [isDirty, setIsDirty] = useState(false);
  const [isToolDirty, setIsToolDirty] = useState(false);

  const [editToolDetail, setEditToolDetail] = useState(null);

  const isCreating = toolkit?.isCreating || false;
  const isMCP = toolkit?.isMCP || toolkit?.meta?.mcp || false;

  const [validationState, setValidationState] = useState({
    hasErrors: false,
    triggerValidation: null,
  });

  // Creation mode state for form values (similar to CreateToolkit.jsx)
  const [formikInitialValues, setFormikInitialValues] = useState({
    type: '',
  });

  const revertCredentialsRef = useRef(null);

  // Callback for handling tool detail changes in creation mode
  const onChangeToolDetail = useCallback((...args) => {
    setIsToolDirty(!!args[0]);
    setEditToolDetail(args[0]);
  }, []);

  const handleToolkitCreated = useCallback(
    createdToolkit => {
      if (onToolkitCreated) {
        onToolkitCreated(createdToolkit);
      }
    },
    [onToolkitCreated],
  );

  const handleToolkitSaved = useCallback(
    (result, toolkitData) => {
      if (!isCreating && onToolkitUpdated && toolkit) {
        const isMcpEntity = isMCP || toolkit?.meta?.mcp;
        trackEvent(
          isMcpEntity ? GA_EVENT_NAMES.MCP_MODIFIED_FROM_CHAT : GA_EVENT_NAMES.TOOLKIT_MODIFIED_FROM_CHAT,
          {
            [GA_EVENT_PARAMS.ENTITY]: isMcpEntity ? 'mcp' : 'toolkit',
            [GA_EVENT_PARAMS.TOOLKIT_NAME]: toolkitData.name,
            [GA_EVENT_PARAMS.MODIFICATION_TYPE]: 'config_update',
            [GA_EVENT_PARAMS.TIMESTAMP]: new Date().toISOString(),
          },
        );

        // Update the existing participant object with the new name
        const updatedParticipant = {
          ...toolkit,
          entity_meta: {
            ...toolkit.entity_meta,
            name: toolkitData.name, // Update the name in entity_meta
          },
          meta: {
            ...toolkit.meta,
            name: toolkitData.name, // Update the name in meta
          },
        };

        onToolkitUpdated(updatedParticipant, true);
      }
      setIsToolDirty(false);
      setIsDirty(false);
    },
    [isCreating, onToolkitUpdated, toolkit, isMCP, trackEvent],
  );

  const projectId = useSelectedProjectId();
  const toolkitId = getToolkitId(toolkit);
  const isPublic = toolkit?.entity_meta?.project_id === PUBLIC_PROJECT_ID;
  const hasPublicProjectAccess = usePublicProjectAccessCheck();
  // Ensure toolkit schemas are loaded
  const { toolkitSchemas } = useGetCurrentToolkitSchemas();

  // Only fetch details when the editor is visible and we have required IDs (and not in creation mode)
  const { data: toolkitDetails, error } = useToolkitsDetailsQuery(
    projectId && toolkitId && isVisible && !isCreating
      ? { projectId: toolkit?.entity_meta?.project_id || projectId, toolkitId }
      : { skip: true },
    { skip: !isVisible || !projectId || !toolkitId || isCreating },
  );

  // Credential warning hook
  const { showWarning, checkBeforeSave, handlers } = useCredentialWarning({
    isCreating,
    editToolDetail,
    originalDetails: toolkitDetails,
    revertCredentialsRef,
    setEditToolDetail,
  });

  // Initialize editToolDetail from toolkit details (like EditToolkit.jsx)
  useEffect(() => {
    if (isCreating) {
      // In creation mode, start with null editToolDetail
      setEditToolDetail(null);
    } else if (toolkitDetails && isVisible) {
      // TODO: DELETE LegacyOpenApiMigration usage after migration period (Q1 2026)
      setEditToolDetail(LegacyOpenApiMigration.normalizeLegacyOpenApiToolkit(toolkitDetails));
    }
  }, [toolkitDetails, isVisible, isCreating]);

  // Prepare minimal initialValues for Formik (different for edit vs create mode)
  const normalizedInitialValues = useMemo(() => {
    if (isCreating) {
      // Creation mode: use form initial values
      return formikInitialValues;
    }

    if (!toolkitDetails) {
      return {};
    }

    // TODO: DELETE LegacyOpenApiMigration usage after migration period (Q1 2026)
    const normalized = LegacyOpenApiMigration.normalizeLegacyOpenApiToolkit(toolkitDetails);

    return {
      ...normalized,
      // Ensure settings object exists to prevent setFieldValue from making form dirty
      settings: normalized.settings || {},
      // Ensure type is set to prevent setFieldValue from making form dirty
      type: normalized.type || '',
    };
  }, [toolkitDetails, isCreating, formikInitialValues]);

  // Use current form name if available, otherwise fall back to original name
  const toolkitName = useMemo(() => {
    if (isCreating) {
      if (editToolDetail?.name) {
        return editToolDetail.name;
      }
      const toolType = editToolDetail?.type;
      if (toolType) {
        const schema = toolkitSchemas?.[toolType];
        const label = schema?.metadata?.label || schema?.title || formatTitleFromSnakeCase(toolType);
        return `New ${label} ${isMCP ? 'MCP' : 'Toolkit'}`;
      }
      return `New ${isMCP ? 'MCP' : 'Toolkit'}`;
    }
    return editToolDetail?.name || toolkit?.meta?.name || toolkit?.name;
  }, [
    editToolDetail?.name,
    toolkit?.meta?.name,
    toolkit?.name,
    isCreating,
    editToolDetail?.type,
    toolkitSchemas,
    isMCP,
  ]);

  // Get the tool schema from the toolkit schemas
  const toolSchema = useMemo(() => {
    if (editToolDetail?.type && toolkitSchemas) {
      return toolkitSchemas[editToolDetail.type];
    }
    return null;
  }, [editToolDetail?.type, toolkitSchemas]);

  // Custom callback that updates local state (like EditToolkit)
  const handleChangeToolDetail = useCallback(newDetail => {
    setIsToolDirty(!!newDetail);
    setEditToolDetail(newDetail);
  }, []);

  const handleDiscard = useCallback(() => {
    if (isCreating) {
      // In creation mode, reset to initial state
      setEditToolDetail(null);
      setFormikInitialValues({ type: '' });
    } else {
      // In edit mode, reset editToolDetail to original server state (like EditToolkit.jsx)
      if (toolkitDetails) {
        // TODO: DELETE LegacyOpenApiMigration usage after migration period (Q1 2026)
        setEditToolDetail(LegacyOpenApiMigration.normalizeLegacyOpenApiToolkit(toolkitDetails));
      }
    }
    // Reset dirty states
    setIsToolDirty(false);
  }, [toolkitDetails, isCreating]);

  if (!toolkit) {
    return null;
  }

  return (
    <BaseEditor
      isVisible={isVisible}
      isDirty={isDirty}
      setIsDirty={setIsDirty}
      onClose={onCloseToolkitEditor}
      title={toolkitName}
      onDiscard={handleDiscard}
      initialValues={normalizedInitialValues}
      error={error}
      saveButton={
        isCreating ? (
          <CreateToolkitButton
            toolSchema={toolSchema}
            onToolkitCreated={handleToolkitCreated}
            hasErrors={validationState.hasErrors}
            triggerValidation={validationState.triggerValidation}
          />
        ) : (
          <SaveToolkitButton
            toolSchema={toolSchema}
            onToolkitSaved={handleToolkitSaved}
            hasErrors={validationState.hasErrors}
            triggerValidation={validationState.triggerValidation}
            projectId={toolkit?.entity_meta?.project_id || projectId}
            onBeforeSave={checkBeforeSave}
          />
        )
      }
      contentSX={editToolDetail ? undefined : { padding: 0 }} // Remove padding for MCP to use full width
    >
      {isCreating ? (
        // Creation mode: Show ToolkitTypeSelector or ToolkitForm based on whether a type is selected
        <ContentContainer height="100%">
          {editToolDetail ? (
            <ToolkitForm
              editToolDetail={editToolDetail}
              onChangeToolDetail={onChangeToolDetail}
              isEditing={false}
              isToolDirty={isToolDirty}
              isViewToggleVisible={false}
              showNameFieldForcedly={false}
              showToolkitIcon={false}
              showOnlyConfigurationFields={false}
              configurationViewOptions={CONFIGURATION_VIEW_OPTIONS.CredentialsSelect}
              hasNotSavedCredentials={false}
              hideNameDescriptionInput={isMCP || isCreating ? false : true}
              hideOperationButtons={isCreating}
              updateKey={1}
              isMCP={isMCP}
              onValidationStateChange={setValidationState}
              revertCredentialsRef={revertCredentialsRef}
            />
          ) : (
            <ToolkitTypeSelector
              onSelectTool={setEditToolDetail}
              setFormikInitialValues={setFormikInitialValues}
              isMCP={isMCP}
              disableNavigation={true}
            />
          )}
        </ContentContainer>
      ) : editToolDetail ? (
        // Edit mode: Show the existing toolkit configuration
        <ContentContainer height="100%">
          <ToolkitForm
            editToolDetail={editToolDetail}
            onChangeToolDetail={handleChangeToolDetail}
            isEditing={true}
            isToolDirty={isToolDirty}
            isViewToggleVisible={false}
            showNameFieldForcedly={false}
            showToolkitIcon={false}
            showOnlyConfigurationFields={false}
            configurationViewOptions={CONFIGURATION_VIEW_OPTIONS.CredentialsSelect}
            hasNotSavedCredentials={false}
            hideNameDescriptionInput={false}
            hideNameInput={!isMCP}
            hideOperationButtons={true}
            updateKey={1}
            isMCP={isMCP}
            onValidationStateChange={setValidationState}
            disabled={isPublic && !hasPublicProjectAccess}
            revertCredentialsRef={revertCredentialsRef}
          />
        </ContentContainer>
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            {isCreating ? 'Choose toolkit type to get started...' : 'Loading toolkit configuration...'}
          </Typography>
        </Box>
      )}
      <CredentialWarningModal
        open={showWarning}
        onConfirm={handlers.onConfirm}
        onCancel={handlers.onCancel}
        onClose={handlers.onClose}
      />
    </BaseEditor>
  );
};

export default ToolkitEditor;
