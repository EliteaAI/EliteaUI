import { useCallback, useEffect } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { LATEST_VERSION_NAME } from '@/[fsd]/entities/version/lib/constants';
import {
  LAYOUT_VERSION,
  ORIENTATION,
} from '@/[fsd]/features/pipelines/flow-editor/lib/constants/flowEditor.constants';
import { useApplicationCreateMutation } from '@/api/applications';
import { filterEmptyStrings } from '@/common/applicationUtils';
import { PrivateApplicationTabs, SearchParams, ViewMode } from '@/common/constants';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useSavePipeline, { calculateNodesAndEdges } from '@/pages/Pipelines/useSavePipeline';
import { actions } from '@/slices/pipeline';

import RouteDefinitions from '../../routes';

const useCreateApplication = (formik, resetBlockNav, options = {}) => {
  const { skipNavigation = false, onSuccess } = options;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const projectId = useSelectedProjectId();
  const [createRequest, { data, error, isLoading, isError }] = useApplicationCreateMutation();
  const { isFromPipeline, yamlCode } = useSavePipeline();
  const { nodes: flowNodes } = useSelector(state => state.pipelineEditor);
  const create = useCallback(async () => {
    const { nodes, edges } = isFromPipeline
      ? calculateNodesAndEdges(yamlCode, ORIENTATION.vertical, flowNodes)
      : {};
    await createRequest({
      projectId,
      name: formik.values.name?.trim() || '',
      description: formik.values.description,
      type: 'interface',
      webhook_secret: formik.values?.webhook_secret || null,
      versions: [
        {
          name: LATEST_VERSION_NAME,
          tags: formik.values?.version_details?.tags || [],
          instructions: !isFromPipeline ? formik.values?.version_details?.instructions || '' : yamlCode,
          variables: formik.values?.version_details?.variables || [],
          tools: formik.values?.version_details?.tools || [],
          llm_settings: formik.values?.version_details?.llm_settings || {},
          conversation_starters: filterEmptyStrings(formik.values?.version_details?.conversation_starters),
          agent_type: formik.values?.version_details?.agent_type || 'openai',
          welcome_message: formik.values?.version_details?.welcome_message || '',
          pipeline_settings: isFromPipeline
            ? {
                nodes,
                edges,
                orientation: ORIENTATION.vertical,
                layout_version: LAYOUT_VERSION,
              }
            : undefined,
          meta: {
            icon_meta: formik.values?.version_details?.meta?.icon_meta,
            step_limit: formik.values?.version_details?.meta?.step_limit || 25,
          },
        },
      ],
    });
  }, [
    createRequest,
    projectId,
    formik.values.name,
    formik.values.description,
    formik.values?.version_details?.tags,
    formik.values?.version_details?.instructions,
    formik.values?.version_details?.variables,
    formik.values?.version_details?.tools,
    formik.values?.version_details?.llm_settings,
    formik.values?.version_details?.conversation_starters,
    formik.values?.version_details?.agent_type,
    formik.values?.version_details?.welcome_message,
    formik.values?.webhook_secret,
    formik.values?.version_details?.meta?.icon_meta,
    formik.values?.version_details?.meta?.step_limit,
    isFromPipeline,
    yamlCode,
    flowNodes,
  ]);

  useEffect(() => {
    if (error) {
      // todo: handle generic errors
      Array.isArray(error.data)
        ? error.data?.forEach(i => {
            // eslint-disable-next-line no-unused-vars
            const { ctx, loc, msg } = i;
            switch (loc[0]) {
              case 'name':
                formik.setFieldError('name', msg);
                break;
              case 'description':
                formik.setFieldError('description', msg);
                break;
              default:
                // eslint-disable-next-line no-console
                console.warn('Unhandled error', i);
            }
          })
        : // eslint-disable-next-line no-console
          console.error(error);
    }
  }, [error, formik]);

  useEffect(() => {
    if (data) {
      const { id } = data;
      const isForPipeline = !!formik.values?.version_details?.pipeline_settings;
      formik.resetForm(data);
      if (isForPipeline) {
        dispatch(actions.resetPipeline());
      }

      // Call custom onSuccess callback if provided (for chat context)
      if (onSuccess) {
        onSuccess(data);
      }

      // Only navigate if not skipped (for standalone pages)
      if (!skipNavigation) {
        const pathname = `${!isForPipeline ? RouteDefinitions.Applications : RouteDefinitions.Pipelines}/${PrivateApplicationTabs[0]}/${id}`;
        const search = `${SearchParams.DestTab}=configuration&name=${encodeURIComponent(data.name)}&${SearchParams.ViewMode}=${ViewMode.Owner}`;
        resetBlockNav?.();
        setTimeout(() => {
          navigate(
            {
              pathname,
              search,
            },
            {
              replace: true,
              state: {
                routeStack: [
                  {
                    breadCrumb: formik.values.name,
                    viewMode: ViewMode.Owner,
                    pagePath: `${pathname}?${search}`,
                  },
                ],
              },
            },
          );
        }, 0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, skipNavigation, onSuccess]);

  return {
    isLoading,
    create,
    error,
    isError,
  };
};

export default useCreateApplication;
