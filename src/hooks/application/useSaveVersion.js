import { useCallback, useEffect } from 'react';

import { useFormikContext } from 'formik';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import { deepClone } from '@mui/x-data-grid/internals';

import {
  LAYOUT_VERSION,
  ORIENTATION,
} from '@/[fsd]/features/pipelines/flow-editor/lib/constants/flowEditor.constants';
import { cleanLLMSettings } from '@/[fsd]/shared/lib/utils/llmSettings.utils';
import { alitaApi } from '@/api/alitaApi';
import { useApplicationEditMutation } from '@/api/applications';
import { useListModelsQuery } from '@/api/configurations';
import clearTools from '@/common/applicationUtils';
import { buildErrorMessage, removeDuplicateObjects } from '@/common/utils';
import { useIsFrom } from '@/hooks/useIsFromSpecificPageHooks';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';
import useSavePipeline, { calculateNodesAndEdges } from '@/pages/Pipelines/useSavePipeline';
import RouteDefinitions from '@/routes';
import { actions as appActions } from '@/slices/applications';

import useChangeNameInUrlSearchParams from '../useChangeNameInUrlSearchParams';
import useSaveChangedTools from './useSaveChangedTools';

const useSaveVersion = () => {
  const dispatch = useDispatch();
  const handleChangeName = useChangeNameInUrlSearchParams();
  const projectId = useSelectedProjectId();
  const isFromChat = useIsFrom(RouteDefinitions.Chat);
  const { toastError, toastSuccess } = useToast();
  const [saveFn, { isLoading: isSaving, reset }] = useApplicationEditMutation();
  const { onSaveTools, isSavingToolkit } = useSaveChangedTools();
  const { nodes: flowNodes } = useSelector(state => state.pipelineEditor);

  // Fetch models to validate LLM settings against model capabilities
  const { data: modelsData = { items: [] } } = useListModelsQuery(
    { projectId, include_shared: true },
    { skip: !projectId },
  );

  // Get applicationId from URL params - this is always the application ID regardless of version
  // Prefer applicationId from useParams, fallback to Formik state
  const { values, resetForm } = useFormikContext();
  const { agentId } = useParams();
  const applicationId = values?.id || parseInt(agentId, 10);

  const {
    values: { version_details = { tools: [] }, name, description, owner_id, webhook_secret },
  } = useFormikContext();
  const { isFromPipeline, yamlCode } = useSavePipeline();
  const { id: currentUserId } = useSelector(state => state.user);

  const onSave = useCallback(async () => {
    if ((await onSaveTools()) === false) {
      return; // Stop if toolkit save failed
    }
    const { nodes, edges } = isFromPipeline
      ? calculateNodesAndEdges(yamlCode, ORIENTATION.vertical, flowNodes)
      : {};

    // Clean LLM settings based on model capabilities
    const llmSettings = version_details.llm_settings;
    let cleanedLlmSettings = llmSettings;

    if (llmSettings?.model_name) {
      // Find the model based on the llm_settings
      const model =
        modelsData.items.find(
          m => m.name === llmSettings.model_name && m.project_id === llmSettings.model_project_id,
        ) || modelsData.items.find(m => m.name === llmSettings.model_name);

      // Clean the LLM settings to remove reasoning_effort if model doesn't support it
      cleanedLlmSettings = cleanLLMSettings(llmSettings, model);
    }

    const { error, data } = await saveFn({
      name: name?.trim() || '',
      description,
      id: applicationId,
      projectId,
      owner_id,
      webhook_secret: webhook_secret || null,
      version: {
        ...version_details,
        llm_settings: cleanedLlmSettings,
        tags: removeDuplicateObjects(version_details.tags),
        tools: clearTools(version_details?.tools, currentUserId),
        instructions: !isFromPipeline ? version_details.instructions : yamlCode,
        pipeline_settings: isFromPipeline
          ? {
              nodes,
              edges,
              orientation: ORIENTATION.vertical,
              layout_version: LAYOUT_VERSION,
            }
          : undefined,
        meta: {
          ...(version_details?.meta || {}),
          step_limit: version_details?.meta?.step_limit || 25,
        },
      },
    });
    const cloneData = deepClone(data);
    if (error) {
      toastError(buildErrorMessage(error));
    } else {
      toastSuccess(`The ${isFromPipeline ? 'pipeline' : 'agent'} has been updated`);
      dispatch(
        alitaApi.util.updateQueryData('applicationDetails', { applicationId, projectId }, () => {
          return {
            ...cloneData,
          };
        }),
      );
      const savedVersionDetails = {
        ...version_details,
        instructions: !isFromPipeline ? version_details.instructions : yamlCode,
      };
      dispatch(
        alitaApi.util.updateQueryData(
          'getApplicationVersionDetail',
          { applicationId, projectId, versionId: version_details?.id },
          () => {
            return {
              ...savedVersionDetails, // Please note that update application API always returns the base version details, so we need to use the version details from the form which is the selected one.
            };
          },
        ),
      );
      // Only update URL name if NOT in chat (name should remain conversation name in chat)
      if (!isFromChat) {
        handleChangeName(name);
      }
      resetForm?.({
        values: {
          ...cloneData,
          version_details: savedVersionDetails, // Please note that update application API always returns the base version details, so we need to use the version details from the form which is the selected one.
        },
      });
    }
    reset();
  }, [
    onSaveTools,
    isFromPipeline,
    yamlCode,
    flowNodes,
    version_details,
    saveFn,
    name,
    description,
    applicationId,
    projectId,
    owner_id,
    webhook_secret,
    currentUserId,
    isFromChat,
    reset,
    resetForm,
    modelsData.items,
    toastError,
    toastSuccess,
    dispatch,
    handleChangeName,
  ]);

  useEffect(() => {
    dispatch(appActions.setIsSaving(isSaving));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSaving]);

  return { onSave, isSaving: isSaving || isSavingToolkit };
};

export default useSaveVersion;
