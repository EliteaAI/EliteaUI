import { useCallback, useEffect } from 'react';

import { useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import {
  LAYOUT_VERSION,
  ORIENTATION,
} from '@/[fsd]/features/pipelines/flow-editor/lib/constants/flowEditor.constants';
import { useSaveApplicationNewVersionMutation } from '@/api/applications';
import { buildErrorMessage, replaceVersionInPath } from '@/common/utils';
import { useNameFromUrl, useViewModeFromUrl } from '@/hooks/useSearchParamValue';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useSavePipeline, { calculateNodesAndEdges } from '@/pages/Pipelines/useSavePipeline';

import clearTools from '../../common/applicationUtils';
import useNavBlocker from '../useNavBlocker';
import useSaveChangedTools from './useSaveChangedTools';

const useSaveNewVersion = ({
  toastError,
  toastSuccess,
  applicationId,
  versionDetails,
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
  const { isFromPipeline, yamlCode } = useSavePipeline();
  const { onSaveTools } = useSaveChangedTools();
  const { nodes: flowNodes } = useSelector(state => state.pipelineEditor);
  const { setBlockNav } = useNavBlocker();

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
    newVersionData => {
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
    ],
  );

  const onCreateNewVersion = useCallback(
    async newVersionName => {
      const { nodes, edges } = isFromPipeline
        ? calculateNodesAndEdges(yamlCode, ORIENTATION.vertical, flowNodes)
        : {};
      const result = await saveNewVersion({
        ...(versionDetails || {}),
        tools: clearTools(versionDetails?.tools),
        name: newVersionName,
        projectId: selectedProjectId,
        webhook_secret: webhook_secret || null,
        applicationId,
        instructions: !isFromPipeline ? versionDetails.instructions : yamlCode,
        pipeline_settings: isFromPipeline
          ? {
              nodes,
              edges,
              orientation: ORIENTATION.vertical,
              layout_version: LAYOUT_VERSION,
            }
          : undefined,
        meta: {
          ...(versionDetails?.meta || {}),
          step_limit: versionDetails?.meta?.step_limit || 25,
        },
      });
      if ((await onSaveTools(result?.data?.id)) === false) {
        return; // Stop if toolkit save failed
      }
      onSuccessHandler(result?.data);
      return result;
    },
    [
      onSaveTools,
      isFromPipeline,
      yamlCode,
      saveNewVersion,
      versionDetails,
      selectedProjectId,
      webhook_secret,
      applicationId,
      onSuccessHandler,
      flowNodes,
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
