import { useEffect, useMemo, useRef } from 'react';

import YAML from 'js-yaml';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';

import { deepClone } from '@mui/x-data-grid/internals';

import { LATEST_VERSION_NAME } from '@/[fsd]/entities/version/lib/constants';
import {
  ORIENTATION,
  PIPELINE_STATE,
  PipelineNodeTypes,
} from '@/[fsd]/features/pipelines/flow-editor/lib/constants/flowEditor.constants';
import {
  FlowEditorHelpers,
  LayoutHelpers,
  ParsePipelineHelpers,
} from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { cleanLLMSettings, generateLLMSettings } from '@/[fsd]/shared/lib/utils/llmSettings.utils';
import {
  useApplicationDetailsQuery,
  usePublicApplicationDetailsQuery,
  useUpdateApplicationVersionMutation,
} from '@/api/applications.js';
import { useListModelsQuery } from '@/api/configurations';
import { PUBLIC_PROJECT_ID, ViewMode } from '@/common/constants.js';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useViewMode from '@/hooks/useViewMode';
import { actions } from '@/slices/pipeline';
import { actions as editorActions } from '@/slices/pipelineEditor';

export const useCreateApplicationInitialValues = forPipeline => {
  const selectedProjectId = useSelectedProjectId();
  const { data: modelsData = { items: [], total: 0 } } = useListModelsQuery(
    {
      projectId: selectedProjectId,
      include_shared: true,
    },
    { skip: !selectedProjectId },
  );
  const defaultModel = useMemo(() => {
    return modelsData.items.find(model => model.default) || modelsData.items[0] || null;
  }, [modelsData.items]);
  const initialValues = useMemo(
    () => ({
      name: '',
      description: '',
      type: 'interface',
      versions: [
        {
          name: LATEST_VERSION_NAME,
          tags: [],
        },
      ],
      version_details: {
        conversation_starters: [],
        llm_settings: generateLLMSettings(defaultModel, {}, { includeModelInfo: true }),
        instructions: '',
        pipeline_settings: forPipeline
          ? {
              nodes: [],
              edges: [],
            }
          : undefined,
        variables: [],
        tools: [],
        agent_type: forPipeline ? 'pipeline' : undefined,
        meta: {
          step_limit: 25,
        },
      },
      yamlJsonObject: undefined,
    }),
    [defaultModel, forPipeline],
  );

  return {
    modelsData,
    initialValues,
  };
};

// Stable empty object to prevent infinite re-renders
const EMPTY_APPLICATION_DATA = {};

const useApplicationInitialValues = forPipeline => {
  const dispatch = useDispatch();
  const currentProjectId = useSelectedProjectId();
  const viewMode = useViewMode();
  const projectId = useMemo(
    () => (viewMode === ViewMode.Public ? PUBLIC_PROJECT_ID : currentProjectId),
    [currentProjectId, viewMode],
  );
  const { agentId } = useParams();
  const applicationId = useMemo(() => {
    return agentId ? parseInt(agentId, 10) : null;
  }, [agentId]);

  // Fetch models to clean LLM settings based on capabilities
  const { data: modelsData = { items: [] } } = useListModelsQuery(
    { projectId: currentProjectId, include_shared: true },
    { skip: !currentProjectId },
  );

  const [updateApplicationVersion] = useUpdateApplicationVersionMutation();
  const savedVersionsRef = useRef(new Set());
  const {
    data: privateApplicationData,
    isFetching: isFetchingPrivate,
    isError: isPrivateError,
    error: privateError,
  } = useApplicationDetailsQuery(
    { projectId, applicationId },
    { skip: !projectId || !applicationId || viewMode === ViewMode.Public },
  );
  const {
    data: publicApplicationData,
    isFetching: isFetchingPublic,
    isError: isPublicError,
    error: publicError,
  } = usePublicApplicationDetailsQuery(
    { projectId, applicationId },
    { skip: !projectId || !applicationId || projectId != PUBLIC_PROJECT_ID || viewMode !== ViewMode.Public },
  );
  const applicationData = useMemo(
    () =>
      viewMode === ViewMode.Owner || viewMode === ViewMode.Moderator
        ? privateApplicationData || EMPTY_APPLICATION_DATA
        : publicApplicationData || EMPTY_APPLICATION_DATA,
    [privateApplicationData, publicApplicationData, viewMode],
  );

  const isFetching = useMemo(
    () =>
      viewMode === ViewMode.Owner || viewMode === ViewMode.Moderator ? isFetchingPrivate : isFetchingPublic,
    [isFetchingPrivate, isFetchingPublic, viewMode],
  );
  const isError = useMemo(
    () => (viewMode === ViewMode.Owner || viewMode === ViewMode.Moderator ? isPrivateError : isPublicError),
    [isPrivateError, isPublicError, viewMode],
  );
  const error = useMemo(
    () => (viewMode === ViewMode.Owner || viewMode === ViewMode.Moderator ? privateError : publicError),
    [viewMode, privateError, publicError],
  );

  const { initialValues, initialPipeline } = useMemo(() => {
    if (!forPipeline) {
      return {
        initialValues: applicationData,
      };
    } else {
      let parsedYamlJson = undefined;
      try {
        parsedYamlJson = YAML.load(applicationData?.version_details?.instructions);
      } catch {
        // YAML parsing failed, parsedYamlJson remains undefined
      }
      if (
        !applicationData.version_details?.pipeline_settings?.nodes?.length ||
        !applicationData.version_details?.pipeline_settings?.edges?.length ||
        !applicationData.version_details?.pipeline_settings?.nodes.find(
          node => node.type === PipelineNodeTypes.End,
        )
      ) {
        const { nodes: parsedNodes, edges: parsedEdges } = ParsePipelineHelpers.parseYaml(
          parsedYamlJson,
          ORIENTATION.vertical,
        );
        const { nodes, edges } = LayoutHelpers.doLayout({
          nodes: parsedNodes,
          edges: parsedEdges,
          orientation:
            applicationData.version_details?.pipeline_settings?.orientation || ORIENTATION.vertical,
          flowNodes: applicationData.version_details?.pipeline_settings?.nodes || [],
        });
        return {
          initialValues: {
            ...applicationData,
            version_details: {
              ...applicationData.version_details,
              pipeline_settings: {
                nodes: nodes.map(node =>
                  FlowEditorHelpers.convertNode(
                    node,
                    applicationData.version_details?.pipeline_settings?.layout_version,
                  ),
                ),
                edges,
                orientation:
                  applicationData.version_details?.pipeline_settings?.orientation || ORIENTATION.vertical,
                layout_version: applicationData.version_details?.pipeline_settings?.layout_version,
              },
            },
          },
          initialPipeline: {
            nodes: nodes.map(node =>
              FlowEditorHelpers.convertNode(
                node,
                applicationData.version_details?.pipeline_settings?.layout_version,
              ),
            ),
            edges,
            yamlJsonObject: parsedYamlJson,
            yamlCode: applicationData?.version_details?.instructions,
            layout_version: applicationData.version_details?.pipeline_settings?.layout_version,
          },
        };
      } else {
        const cloneNodes = applicationData.version_details.pipeline_settings.nodes
          .map(node =>
            FlowEditorHelpers.convertNode(
              deepClone(node),
              applicationData.version_details?.pipeline_settings?.layout_version,
            ),
          )
          .filter(node => node.type !== PIPELINE_STATE);
        return {
          initialValues: {
            ...applicationData,
            version_details: {
              ...applicationData.version_details,
              pipeline_settings: {
                ...applicationData.version_details?.pipeline_settings,
                nodes: [...cloneNodes],
              },
            },
          },
          initialPipeline: {
            nodes: cloneNodes,
            edges: applicationData.version_details.pipeline_settings.edges,
            yamlJsonObject: parsedYamlJson,
            yamlCode: applicationData?.version_details?.instructions,
            layout_version: applicationData.version_details?.pipeline_settings?.layout_version,
          },
        };
      }
    }
  }, [applicationData, forPipeline]);

  useEffect(() => {
    if (forPipeline && Object.keys(applicationData).length && initialPipeline) {
      dispatch(
        actions.initThePipeline({
          ...initialPipeline,
        }),
      );
      dispatch(editorActions.resetPipelineEditor());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPipeline]);

  // Save generated pipeline_settings back to backend for old imported versions
  useEffect(() => {
    const versionId = applicationData?.version_details?.id;
    const hasPipelineSettings =
      Object.keys(applicationData?.version_details?.pipeline_settings || {}).length > 0;
    const hasGeneratedPipeline = initialPipeline?.nodes?.length > 0 && initialPipeline?.edges?.length > 0;

    // Only save if:
    // 1. This is a pipeline
    // 2. Backend doesn't have pipeline_settings
    // 3. We successfully generated them
    // 4. We haven't already saved this version
    // 5. We're not in public view mode (can't update public versions)
    if (
      forPipeline &&
      versionId &&
      !hasPipelineSettings &&
      hasGeneratedPipeline &&
      !savedVersionsRef.current.has(versionId) &&
      viewMode === ViewMode.Owner &&
      projectId &&
      applicationId
    ) {
      savedVersionsRef.current.add(versionId);

      // Save the generated pipeline_settings to the backend with complete version details
      const versionDetails = applicationData.version_details;
      const pipelineSettings = initialValues?.version_details?.pipeline_settings;

      if (pipelineSettings && versionDetails) {
        // Find the model based on the llm_settings to clean the payload
        const modelName = versionDetails.llm_settings?.model_name;
        const modelProjectId = versionDetails.llm_settings?.model_project_id;
        const model =
          modelsData.items.find(m => m.name === modelName && m.project_id === modelProjectId) ||
          modelsData.items.find(m => m.name === modelName);

        // Clean LLM settings to remove reasoning_effort if model doesn't support it
        const cleanedLlmSettings = cleanLLMSettings(versionDetails.llm_settings, model);

        updateApplicationVersion({
          projectId,
          applicationId,
          versionId,
          // Complete payload structure required by API
          name: versionDetails.name,
          tags: versionDetails.tags || [],
          instructions: versionDetails.instructions,
          llm_settings: cleanedLlmSettings,
          variables: versionDetails.variables || [],
          tools: versionDetails.tools || [],
          conversation_starters: versionDetails.conversation_starters || [],
          agent_type: versionDetails.agent_type,
          welcome_message: versionDetails.welcome_message || '',
          meta: versionDetails.meta || {},
          pipeline_settings: pipelineSettings,
        })
          .unwrap()
          .then(() => {
            // Successfully saved generated pipeline_settings
          })
          .catch(() => {
            // Failed to save pipeline_settings, remove from saved set to retry
          });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues]);

  return {
    isFetching,
    initialValues,
    applicationId,
    isError,
    error,
    modelsData,
  };
};

export default useApplicationInitialValues;
