import { useCallback, useEffect } from 'react';

import { useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import {
  useNameFromUrl,
  useSelectedProjectId,
  useStaleSaveGuard,
  useViewModeFromUrl,
} from '@/[fsd]/shared/lib/hooks';
import { useSaveApplicationNewVersionMutation } from '@/api/applications';
import clearTools, { filterEmptyStrings } from '@/common/applicationUtils';
import { buildErrorMessage, replaceVersionInPath } from '@/common/utils';
import useSavePipeline, { calculateNodesAndEdges } from '@/pages/Pipelines/useSavePipeline';

import useNavBlocker from '../useNavBlocker';
import useSaveChangedTools from './useSaveChangedTools';

const { LAYOUT_VERSION } = FlowEditorConstants;

const useSaveNewVersion = ({
  toastError,
  toastSuccess,
  applicationId,
  versionDetails,
  sourceVersionId,
  onSuccess,
  webhook_secret,
}) => {
  const selectedProjectId = useSelectedProjectId();
  const navigate = useNavigate();
  const { state: locationState, pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const { version: currentVersionId } = useParams();
  const viewMode = useViewModeFromUrl();
  const name = useNameFromUrl();
  const { isFromPipeline, yamlCode, orientation } = useSavePipeline();
  const { onSaveTools } = useSaveChangedTools();
  const { nodes: flowNodes } = useSelector(state => state.pipelineEditor);
  const { setBlockNav } = useNavBlocker();
  const { captureSaveTarget, isSaveTargetCurrent } = useStaleSaveGuard(applicationId);

  const [
    saveNewVersion,
    {
      isLoading: isSavingNewVersion,
      isSuccess: isSavingNewVersionSuccess,
      isError: isSavingNewVersionError,
      error,
      reset,
    },
  ] = useSaveApplicationNewVersionMutation();

  const onSuccessHandler = useCallback(
    (newVersionData, saveTarget) => {
      // Opening the new version would pull the user back from the agent or pipeline they moved to
      if (newVersionData?.id && saveTarget && !isSaveTargetCurrent(saveTarget)) {
        reset();
        return;
      }
      if (newVersionData?.id) {
        // Use the new version ID directly from the response
        const newVersionId = newVersionData.id;
        const newPath = replaceVersionInPath(newVersionId, pathname, currentVersionId, applicationId);
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.append('isFromCreation', 'true');
        const routeStack = [...(locationState?.routeStack || [])];
        if (routeStack.length) {
          routeStack[routeStack.length - 1] = {
            ...routeStack[routeStack.length - 1],
            pagePath: `${newPath}?${newSearchParams.toString()}`,
          };
        } else {
          routeStack.push({
            pagePath: `${newPath}?${newSearchParams.toString()}`,
            breadCrumb: name,
            viewMode,
          });
        }

        onSuccess?.();
        // Note: No need to manually reset pipelineEditor - the new page's resetFlag effect
        // in FlowEditor will sync nodes with measured heights to Redux automatically

        setBlockNav(false);
        // Increase timeout to allow cache invalidation to complete
        setTimeout(() => {
          if (saveTarget && !isSaveTargetCurrent(saveTarget)) return;
          navigate(
            {
              pathname: newPath,
              search: newSearchParams.toString(),
            },
            {
              replace: true,
              state: {
                routeStack,
              },
            },
          );
        }, 300);
        reset();
      }
    },
    [
      currentVersionId,
      locationState,
      name,
      navigate,
      pathname,
      applicationId,
      reset,
      searchParams,
      viewMode,
      onSuccess,
      setBlockNav,
      isSaveTargetCurrent,
    ],
  );

  const onCreateNewVersion = useCallback(
    async newVersionName => {
      const saveTarget = captureSaveTarget();
      const { nodes, edges } = isFromPipeline ? calculateNodesAndEdges(yamlCode, orientation, flowNodes) : {};

      // Reset trigger to default 'chat_message' for new versions
      const triggerConfig = isFromPipeline ? { type: 'chat_message' } : null;

      const result = await saveNewVersion({
        ...(versionDetails || {}),
        tools: clearTools(versionDetails?.tools),
        conversation_starters: filterEmptyStrings(versionDetails?.conversation_starters),
        copy_skills_from_version_id: sourceVersionId,
        name: newVersionName,
        projectId: selectedProjectId,
        webhook_secret: webhook_secret || null,
        applicationId,
        instructions: !isFromPipeline ? versionDetails.instructions : yamlCode,
        pipeline_settings: isFromPipeline
          ? {
              nodes,
              edges,
              orientation,
              layout_version: LAYOUT_VERSION,
              trigger: triggerConfig,
            }
          : undefined,
        meta: {
          ...(versionDetails?.meta || {}),
          step_limit: versionDetails?.meta?.step_limit || 25,
        },
      });
      // A new pipeline version is created with the tools its nodes picked, so they need no extra requests
      if (!isFromPipeline && (await onSaveTools(result?.data?.id)) === false) {
        return; // Stop if toolkit save failed
      }
      onSuccessHandler(result?.data, saveTarget);
      return result;
    },
    [
      onSaveTools,
      isFromPipeline,
      yamlCode,
      orientation,
      saveNewVersion,
      versionDetails,
      sourceVersionId,
      selectedProjectId,
      webhook_secret,
      applicationId,
      onSuccessHandler,
      flowNodes,
      captureSaveTarget,
    ],
  );

  useEffect(() => {
    if (isSavingNewVersionError) {
      toastError(buildErrorMessage(error));
      reset();
    } else if (isSavingNewVersionSuccess) {
      toastSuccess && toastSuccess('Saved new version successfully');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSavingNewVersionError, isSavingNewVersionSuccess]);

  return {
    onCreateNewVersion,
    isSavingNewVersion,
    isSavingNewVersionError,
    isSavingNewVersionSuccess,
  };
};

export default useSaveNewVersion;
