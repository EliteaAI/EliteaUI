import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useFormikContext } from 'formik';
import YAML from 'js-yaml';
import { useDispatch } from 'react-redux';

import { Box, Tab, Tabs } from '@mui/material';

import { useTrackEvent } from '@/GA';
import { InstructionsInputRefProvider } from '@/[fsd]/app/providers';
import CreateAgentForm from '@/[fsd]/features/agent/ui/agent-details/configurations/form/CreateAgentForm';
import { useConversationStartersSync } from '@/[fsd]/features/chat/lib/hooks';
import useRefetchAgentVersionDetailsOnClose from '@/[fsd]/features/chat/lib/hooks/useRefetchAgentVersionDetailsOnClose';
import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { LayoutHelpers, ParsePipelineHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { GA_EVENT_NAMES, GA_EVENT_PARAMS } from '@/[fsd]/shared/lib/constants/analytic.constants';
import { DEFAULT_REASONING_EFFORT } from '@/[fsd]/shared/lib/constants/llmSettings.constants';
import { useGetApplicationVersionDetailQuery, usePublicApplicationDetailsQuery } from '@/api/applications';
import FlowIcon from '@/assets/flow-icon.svg?react';
import { ChatParticipantType, PERMISSIONS, PUBLIC_PROJECT_ID, ViewMode } from '@/common/constants.js';
import GearIcon from '@/components/Icons/GearIcon.jsx';
import { StyledTabBar } from '@/components/StyledTabs.jsx';
import useCheckPermission from '@/hooks/useCheckPermission';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import getValidateSchema from '@/pages/Applications/Components/Applications/ApplicationCreationValidateSchema';
import ApplicationValidator from '@/pages/Applications/Components/Applications/ApplicationValidator';
import CreateApplicationSaveButton from '@/pages/Applications/Components/Applications/CreateApplicationSaveButton';
import PipelineConfigurationForm from '@/pages/Applications/Components/Applications/PipelineConfigurationForm.jsx';
import SaveApplicationButton from '@/pages/Applications/Components/Applications/SaveApplicationButton.jsx';
import { useCreateApplicationInitialValues } from '@/pages/Applications/useApplicationInitialValues';
import { ContentContainer } from '@/pages/Common/Components/StyledComponents.jsx';
import BaseEditor from '@/pages/NewChat/components/BaseEditor.jsx';
import LLMModelSelectorWrapper from '@/pages/NewChat/components/LLMModelSelectorWrapper';
import EditorPanel from '@/pages/Pipelines/Components/EditorPanel';
import { actions } from '@/slices/pipeline';
import { actions as editorActions } from '@/slices/pipelineEditor';

const getPipelineId = pipeline => {
  // pipeline is a chat participant with entity_meta structure
  return pipeline?.entity_meta?.id || pipeline?.id || pipeline?.meta?.id;
};

const PipelineEditorContent = memo(props => {
  const {
    viewMode,
    canEditIt,
    isPublic,
    pipelineId,
    projectId,
    handleAttachmentToolChange,
    entityProjectId,
    onConversationStartersChange,
  } = props;
  const { setFieldValue } = useFormikContext();
  const styles = getStyles();

  useConversationStartersSync(onConversationStartersChange);

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
    <Box>
      <LLMModelSelectorWrapper
        projectId={projectId}
        onLLMSettingsChange={onLLMSettingsChange}
        disabled={!canEditIt}
        modelTooltip={isPublic ? 'Model configuration is locked for Public agents' : undefined}
        settingsTooltip={isPublic ? 'Model settings are locked for Public agents' : undefined}
      />
      <PipelineConfigurationForm
        applicationId={pipelineId}
        viewMode={viewMode}
        isChatView
        containerStyle={styles.configForm}
        hidePythonSandbox
        onAttachmentToolChange={handleAttachmentToolChange}
        entityProjectId={entityProjectId}
      />
    </Box>
  );
});

PipelineEditorContent.displayName = 'PipelineEditorContent';

const PipelineEditor = forwardRef(
  (
    {
      pipeline,
      onClosePipelineEditor,
      isVisible,
      isCreateMode = false,
      onPipelineCreated,
      onPipelineSaved,
      onPipelineDirtyStateChange,
      stopRunOnNodeStop,
      activeParticipantId,
      onAttachmentToolChange,
      onConversationStartersChange,
    },
    ref,
  ) => {
    const trackEvent = useTrackEvent();

    const dispatch = useDispatch();
    const editorPanelRef = useRef();
    const { checkPermission } = useCheckPermission();
    const hasEditPermission = useMemo(() => {
      return checkPermission(PERMISSIONS.applications.update);
    }, [checkPermission]);
    // State for dirty tracking
    const [isDirty, setIsDirty] = useState(false);
    const [isYamlDirty, setIsYamlDirty] = useState(false);
    // Always start with Configuration tab (0) - reset when pipeline or mode changes
    const [activeTab, setActiveTab] = useState(0);
    const isPublic = pipeline?.entity_meta?.project_id === PUBLIC_PROJECT_ID;
    const canEditIt = !isPublic && hasEditPermission;
    const viewMode = canEditIt ? ViewMode.Owner : ViewMode.Public;
    // Node management callbacks for pipeline execution
    const onRcvAgentEvent = useCallback(
      event => {
        if (pipeline?.id && activeParticipantId === pipeline?.id) {
          editorPanelRef.current?.onRcvAgentEvent(event);
        }
      },
      [pipeline, activeParticipantId],
    );

    const deleteAllRunNodes = useCallback(() => {
      editorPanelRef.current?.deleteAllRunNodes();
    }, []);

    const onStopRun = useCallback(
      isChat => {
        if (isChat) editorPanelRef.current?.onStopRun();
        else stopRunOnNodeStop(true);
      },
      [stopRunOnNodeStop],
    );

    // Expose methods to parent component for chat integration
    useImperativeHandle(
      ref,
      () => ({
        onRcvAgentEvent,
        deleteAllRunNodes,
        onStopRun,
      }),
      [onRcvAgentEvent, deleteAllRunNodes, onStopRun],
    );

    // Track both form and YAML dirty states
    const totalDirty = useMemo(() => isDirty || isYamlDirty, [isDirty, isYamlDirty]);

    // Reset state when switching pipelines or modes
    useEffect(() => {
      setActiveTab(0);
      setIsDirty(false);
      setIsYamlDirty(false);

      // Clear Redux pipeline state to prevent stale data
      dispatch(
        actions.initThePipeline({
          nodes: [],
          edges: [],
          yamlJsonObject: {
            state: FlowEditorConstants.DefaultState,
          },
          yamlCode: '',
        }),
      );
      dispatch(editorActions.resetPipelineEditor());
    }, [isCreateMode, pipeline?.entity_meta?.id, dispatch]);
    const projectId = useSelectedProjectId();
    const pipelineId = getPipelineId(pipeline);
    const versionId = pipeline?.entity_settings?.version_id;
    // Get standard initial values for create mode (pipelines use the same structure as applications)
    const { initialValues: createInitialValues } = useCreateApplicationInitialValues(true); // true for pipeline

    // Fetch version details in edit mode only
    const isPublishedPipeline = pipeline?.entity_meta?.project_id == PUBLIC_PROJECT_ID;
    const {
      data: privateVersionDetails,
      error: privateError,
      refetch: refetchPrivateVersionDetails,
    } = useGetApplicationVersionDetailQuery(
      projectId && pipelineId && versionId && isVisible && !isCreateMode && !isPublishedPipeline
        ? { projectId: pipeline.entity_meta?.project_id || projectId, applicationId: pipelineId, versionId }
        : { skip: true },
      {
        skip: !isVisible || !projectId || !pipelineId || !versionId || isCreateMode || isPublishedPipeline,
        refetchOnMountOrArgChange: true,
      },
    );
    const {
      data: publicAppDetails,
      error: publicError,
      refetch: refetchPublicAppDetails,
    } = usePublicApplicationDetailsQuery(
      { applicationId: pipelineId },
      { skip: !isVisible || !pipelineId || !isPublishedPipeline || isCreateMode },
    );
    const versionDetails = isPublishedPipeline ? publicAppDetails : privateVersionDetails;
    const error = isPublishedPipeline ? publicError : privateError;
    const refetchVersionDetails = isPublishedPipeline
      ? refetchPublicAppDetails
      : refetchPrivateVersionDetails;
    const { refetchAgentVersionDetailsOnClose } = useRefetchAgentVersionDetailsOnClose({
      refetchVersionDetails,
    });
    const onClose = useCallback(() => {
      onClosePipelineEditor?.();
      refetchAgentVersionDetailsOnClose();
    }, [onClosePipelineEditor, refetchAgentVersionDetailsOnClose]);
    // Transform API response to pipeline participant format for chat context
    const handlePipelineCreated = useCallback(
      result => {
        if (result && onPipelineCreated) {
          const createdPipeline = {
            participantType: ChatParticipantType.Pipelines,
            ...result,
            agent_type: result.version_details?.agent_type || 'pipeline',
            entity_settings: {
              ...result.entity_settings,
              version_id: result.version_details?.id,
              agent_type: result.version_details?.agent_type || 'pipeline',
            },
          };

          onPipelineCreated(createdPipeline);
        }
      },
      [onPipelineCreated],
    );

    const fileReaderEnhancerRef = useRef();

    // Prepare initial values for the formik
    const initialValues = useMemo(() => {
      if (isCreateMode) {
        return createInitialValues;
      }

      // Edit mode: validate version details to prevent using stale cached data
      if (versionDetails) {
        const currentVersionId = versionDetails.version_details?.id || versionDetails.id;
        const isValidVersion = currentVersionId === versionId;

        if (isValidVersion) {
          const pipelineName = pipeline?.meta?.name || pipeline?.name || '';

          // Use nested structure if available, otherwise flatten
          if (versionDetails.version_details) {
            return {
              ...versionDetails,
              id: pipelineId,
              name: pipelineName,
              llm_settings: versionDetails.version_details.llm_settings,
            };
          }

          return {
            ...versionDetails,
            id: pipelineId,
            name: pipelineName,
            version_details: {
              ...versionDetails,
              llm_settings: versionDetails.llm_settings,
            },
          };
        }
        // If version doesn't match, fall through to fallback
      }

      // Fallback: return basic structure while waiting for correct version data
      if (pipeline && pipelineId) {
        return {
          id: pipelineId,
          name: pipeline?.meta?.name || pipeline?.name || '',
          description: '', // Will be populated when API data loads
          version_details: {
            instructions: '',
            llm_settings: {
              model_name: '',
              model_project_id: projectId,
              temperature: 0.7,
              reasoning_effort: DEFAULT_REASONING_EFFORT,

              max_tokens: 4096,
            },
            variables: pipeline?.entity_settings?.variables || [],
            conversation_starters: [],
            tags: [],
            welcome_message: '',
            agent_type: 'react', // Default for pipelines
            meta: {
              icon_meta: pipeline?.entity_settings?.icon_meta || null,
            },
          },
        };
      }

      return {};
    }, [isCreateMode, versionDetails, pipeline, pipelineId, createInitialValues, versionId, projectId]);

    // Initialize Redux state when versionDetails changes (matches Pipelines page pattern)
    // Triggers on initial load and after save when RTK Query cache updates
    useEffect(() => {
      if (isCreateMode || !versionDetails) {
        return;
      }

      const currentVersionId = versionDetails.version_details?.id || versionDetails.id;

      // Prevent initialization with stale RTK Query cached data - reject if version IDs don't match
      if (currentVersionId !== versionId) {
        return;
      }

      // Extract instructions from nested or flat API response structure
      const instructions = versionDetails.version_details?.instructions || versionDetails.instructions || '';

      // Parse YAML instructions (empty string is valid - will create just an END node)
      let parsedYamlJson;
      try {
        parsedYamlJson = YAML.load(instructions);
      } catch {
        return;
      }

      const { nodes: parsedNodes, edges: parsedEdges } = ParsePipelineHelpers.parseYaml(parsedYamlJson);
      // Use saved nodes with measured heights to prevent layout fallback to undersized defaults
      const savedNodes =
        versionDetails.version_details?.pipeline_settings?.nodes ||
        versionDetails.pipeline_settings?.nodes ||
        [];
      const { nodes, edges } = LayoutHelpers.doLayout({
        nodes: parsedNodes,
        edges: parsedEdges,
        flowNodes: savedNodes,
      });

      // initThePipeline sets resetFlag, triggering FlowEditor to sync its local state
      const layout_version =
        versionDetails.version_details?.pipeline_settings?.layout_version ||
        versionDetails.pipeline_settings?.layout_version;
      const initialPipeline = {
        nodes,
        edges,
        yamlJsonObject: parsedYamlJson,
        yamlCode: instructions,
        layout_version,
      };

      dispatch(actions.initThePipeline(initialPipeline));
      dispatch(editorActions.resetPipelineEditor());
    }, [dispatch, isCreateMode, versionDetails, versionId]);

    const handleTabChange = useCallback((event, newValue) => {
      setActiveTab(newValue);
    }, []);

    const handleDiscard = useCallback(() => {
      // Reset the form to initial values
      fileReaderEnhancerRef.current?.restoreValue(initialValues?.version_details?.instructions || '');
      setIsDirty(false);
      setIsYamlDirty(false);
      dispatch(actions.resetPipeline());
      dispatch(editorActions.resetPipelineEditor());
    }, [dispatch, initialValues?.version_details?.instructions]);

    // Reset dirty states after save; versionDetails useEffect handles Redux updates
    const handleSaveSuccess = useCallback(
      savedFormData => {
        setIsDirty(false);
        setIsYamlDirty(false);

        // Notify parent component if needed
        if (onPipelineSaved && savedFormData) {
          trackEvent(GA_EVENT_NAMES.PIPELINE_MODIFIED_FROM_CHAT, {
            [GA_EVENT_PARAMS.ENTITY]: 'pipeline',
            [GA_EVENT_PARAMS.PIPELINE_ID]: pipelineId,
            [GA_EVENT_PARAMS.MODIFICATION_TYPE]: 'config_update',
            [GA_EVENT_PARAMS.TIMESTAMP]: new Date().toISOString(),
            [GA_EVENT_PARAMS.PIPELINE_NAME]: savedFormData.name || 'unknown',
          });
          onPipelineSaved(savedFormData);
        }
      },
      [onPipelineSaved, pipelineId, trackEvent],
    );

    const handleAttachmentToolChange = useCallback(() => {
      onAttachmentToolChange?.(pipeline?.id);
      // Refetch agent details to get updated attachment/tool configuration
      if (refetchVersionDetails && !isCreateMode) {
        refetchVersionDetails();
      }
    }, [isCreateMode, onAttachmentToolChange, pipeline?.id, refetchVersionDetails]);
    // Early return null when pipeline is null and not in create mode
    if (!pipeline && !isCreateMode) {
      return null;
    }

    const editorTitle = isCreateMode
      ? 'Create New Pipeline'
      : pipeline?.meta?.name || pipeline?.name || 'Unnamed Pipeline';
    const editorSubtitle = isCreateMode ? '' : initialValues?.version_details?.name;
    const styles = getStyles();

    return (
      <InstructionsInputRefProvider inputRef={fileReaderEnhancerRef}>
        <BaseEditor
          isVisible={isVisible}
          isDirty={totalDirty}
          setIsDirty={setIsDirty}
          onClose={onClose}
          title={editorTitle}
          subtitle={editorSubtitle}
          onDiscard={handleDiscard}
          initialValues={initialValues}
          validationSchema={getValidateSchema}
          error={error}
          onDirtyStateChange={onPipelineDirtyStateChange}
          formContent={
            !isCreateMode ? (
              <StyledTabBar sx={styles.tabBar}>
                <Box sx={styles.tabsContainer}>
                  <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    aria-label="pipeline editor tabs"
                    sx={styles.customTabs}
                  >
                    <Tab
                      sx={styles.tab}
                      icon={<GearIcon />}
                      label="Configuration"
                      iconPosition="start"
                    />
                    <Tab
                      sx={styles.tab}
                      icon={<FlowIcon />}
                      label="Flow editor"
                      iconPosition="start"
                    />
                  </Tabs>
                </Box>
              </StyledTabBar>
            ) : null
          }
          saveButton={
            isCreateMode ? (
              <CreateApplicationSaveButton onSuccess={handlePipelineCreated} />
            ) : (
              <SaveApplicationButton onSuccess={handleSaveSuccess} />
            )
          }
          isPublic={!canEditIt}
        >
          <ApplicationValidator
            agentId={pipelineId}
            projectId={pipeline?.entity_meta?.project_id || projectId}
            isCreateMode={isCreateMode}
          />

          {isCreateMode && (
            <CreateAgentForm
              sx={styles.createForm}
              showInstructions={false}
            />
          )}

          {/* Configuration Tab Content */}
          {activeTab === 0 && (
            <PipelineEditorContent
              viewMode={viewMode}
              canEditIt={canEditIt}
              isPublic={isPublic}
              pipelineId={pipelineId}
              projectId={projectId}
              handleAttachmentToolChange={handleAttachmentToolChange}
              onConversationStartersChange={onConversationStartersChange}
              entityProjectId={pipeline?.entity_meta?.project_id}
            />
          )}

          {/* Flow Editor Tab Content */}
          {activeTab === 1 && !isCreateMode && (
            <ContentContainer sx={styles.flowEditorContainer}>
              <EditorPanel
                ref={editorPanelRef}
                setYamlDirty={setIsYamlDirty}
                disabled={viewMode === ViewMode.Public}
                stopRun={onStopRun}
              />
            </ContentContainer>
          )}

          {/* Show message for Flow editor in create mode */}
          {activeTab === 1 && isCreateMode && (
            <Box sx={styles.createModeMessage}>Save the pipeline to access the flow editor.</Box>
          )}
        </BaseEditor>
      </InstructionsInputRefProvider>
    );
  },
);

PipelineEditor.displayName = 'PipelineEditor';

/**
 * @type {MuiSx}
 */
const getStyles = () => ({
  createForm: {
    margin: '0 auto',
    maxWidth: '100%',
    width: '100%',
    padding: '1rem',
  },
  configForm: {
    paddingBottom: 0,
  },
  tabBar: theme => ({
    boxSizing: 'border-box',
    padding: '0 1.5rem',
    background: `${theme.palette.background.tabPanel} !important`,
  }),
  tabsContainer: {
    display: 'flex',
  },
  customTabs: theme => ({
    [theme.breakpoints.up('lg')]: {
      width: 'auto',
    },
    marginRight: '2rem',
    marginTop: '16px',
    minHeight: '2rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    '& button': {
      minHeight: '1.875rem',
      textTransform: 'capitalize',
    },
    '& button>svg': {
      fontSize: '1rem',
    },
  }),
  tab: {
    padding: '0.25rem 1.25rem',
    flex: '0 0 auto',
  },
  flowEditorContainer: {
    height: 'calc(100% + 16px)',
    marginLeft: '-16px',
    marginRight: '-16px',
    marginBottom: '-16px',
  },
  hiddenTab: {
    display: 'none',
  },
  createModeMessage: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '200px',
    color: 'text.secondary',
    fontStyle: 'italic',
  },
});

export default PipelineEditor;
