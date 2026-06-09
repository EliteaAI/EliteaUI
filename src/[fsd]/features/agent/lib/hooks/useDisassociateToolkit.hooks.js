import { useCallback } from 'react';

import { useFormikContext } from 'formik';
import { useDispatch, useSelector } from 'react-redux';

import { useSetRefetchDetails } from '@/[fsd]/features/agent/lib/hooks/useRefetchAgentDetails.hooks';
import {
  TAG_TYPE_APPLICATION_DETAILS,
  useApplicationEditMutation,
  useUpdateApplicationRelationMutation,
} from '@/api/applications';
import { eliteaApi } from '@/api/eliteaApi';
import { useToolkitAssociateMutation } from '@/api/toolkits';
import clearTools from '@/common/applicationUtils';
import { buildErrorMessage } from '@/common/utils';
import usePipelineToolsChanges from '@/hooks/pipeline/usePipelineToolsChanges';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

/**
 * Checks if an error is due to a stale version reference (version was deleted/replaced)
 * This happens when a child agent version is deleted and replaced while the parent
 * agent page was still open with cached data.
 */
const isStaleVersionReferenceError = error => {
  const errorMessage = error?.data?.error || error?.message || '';
  return errorMessage.includes('Already removed relation');
};

export const useDisassociateToolkit = ({ applicationId, versionId, onDeleteAttachmentTool, index }) => {
  const projectId = useSelectedProjectId();
  const dispatch = useDispatch();
  const { onRemoveTool, isFromPipeline, getCleanYamlForInitial, syncInitStateWithCleanYaml } =
    usePipelineToolsChanges();
  const { setRefetch } = useSetRefetchDetails();
  const { toastError, toastInfo } = useToast();
  const { resetForm, setValues, values, initialValues, dirty } = useFormikContext();
  const { id: currentUserId } = useSelector(state => state.user);
  const [disassociateToolkit, { isLoading, isError: isDisassociateError, error: disassociateError, reset }] =
    useToolkitAssociateMutation();
  const [updateApplicationRelation] = useUpdateApplicationRelationMutation();
  const [saveApplication] = useApplicationEditMutation();

  // Helper function to invalidate cache and trigger refetch
  const invalidateCacheAndRefresh = useCallback(() => {
    dispatch(eliteaApi.util.invalidateTags([TAG_TYPE_APPLICATION_DETAILS]));
    setRefetch();
  }, [dispatch, setRefetch]);

  // Saves the pipeline to DB immediately after toolkit removal, using the last-saved state as base
  // with only the toolkit removal applied. Other pending unsaved changes are NOT included.
  const savePipelineAfterToolkitRemoval = useCallback(
    async (updatedInitialVersionDetails, tool, isAttachmentToolkit = false) => {
      // Derive clean YAML from the last-saved instructions, not from the current Redux YAML state
      // which may contain other unsaved edits unrelated to this toolkit removal.
      const newYamlCode = getCleanYamlForInitial(initialValues.version_details?.instructions, tool);
      if (!newYamlCode) return;
      const { error, data } = await saveApplication({
        name: initialValues.name?.trim() || '',
        description: initialValues.description,
        id: applicationId,
        projectId,
        owner_id: initialValues.owner_id,
        webhook_secret: initialValues.webhook_secret || null,
        version: {
          ...updatedInitialVersionDetails,
          tools: clearTools(updatedInitialVersionDetails.tools || [], currentUserId),
          instructions: newYamlCode,
          pipeline_settings: initialValues.version_details?.pipeline_settings,
        },
      });
      if (!error && data) {
        // Only update the version detail cache — not applicationDetails, which would trigger
        // enableReinitialize on the Formik form and discard the user's unsaved changes.
        dispatch(
          eliteaApi.util.updateQueryData(
            'getApplicationVersionDetail',
            { applicationId, projectId, versionId: updatedInitialVersionDetails?.id },
            () => ({
              ...updatedInitialVersionDetails,
              instructions: newYamlCode,
            }),
          ),
        );
        // Update Formik baseline so Discard restores to the auto-saved state (toolkit removed + clean YAML).
        resetForm({
          values: {
            ...(initialValues || {}),
            version_details: {
              ...updatedInitialVersionDetails,
              instructions: newYamlCode,
            },
          },
        });
        // Restore user's current unsaved changes (name, LLM settings, etc.) on top of the new baseline.
        // `values` is the pre-removal snapshot from the closure; we recompute the toolkit removal here.
        const filteredCurrentTools = (values.version_details?.tools || []).filter(t => t.id !== tool.id);
        const currentVersionDetails = isAttachmentToolkit
          ? {
              ...(values.version_details || {}),
              tools: filteredCurrentTools,
              instructions: newYamlCode,
              meta: {
                ...(values.version_details?.meta || {}),
                attachment_toolkit_id: undefined,
              },
            }
          : {
              ...(values.version_details || {}),
              tools: filteredCurrentTools,
              instructions: newYamlCode,
            };
        setValues({
          ...(values || {}),
          version_details: currentVersionDetails,
        });
        // Sync Redux initState with the clean saved YAML so Discard resets to the
        // saved state and does not re-include unsaved flow editor changes.
        syncInitStateWithCleanYaml(newYamlCode);
      }
    },
    [
      applicationId,
      currentUserId,
      dispatch,
      getCleanYamlForInitial,
      initialValues,
      projectId,
      resetForm,
      saveApplication,
      setValues,
      syncInitStateWithCleanYaml,
      values,
    ],
  );

  // Updates both Formik initialValues (Discard baseline) and current values after toolkit removal.
  // resetForm sets initialValues so that Discard does not restore the toolkit.
  // setValues re-applies the user's current changes, preserving other pending edits.
  const applyToolRemoval = useCallback(
    (tool, toolIndex, isAttachmentToolkit = false) => {
      const filteredCurrentTools = (values.version_details?.tools || []).filter((_, i) => i !== toolIndex);
      const filteredInitialTools = (initialValues?.version_details?.tools || []).filter(
        t => t.id !== tool.id,
      );
      const updatedCurrentVersionDetails = isAttachmentToolkit
        ? {
            ...(values.version_details || {}),
            tools: filteredCurrentTools,
            meta: {
              ...(values.version_details?.meta || {}),
              attachment_toolkit_id: undefined,
            },
          }
        : {
            ...(values.version_details || {}),
            tools: filteredCurrentTools,
          };
      const updatedInitialVersionDetails = isAttachmentToolkit
        ? {
            ...(initialValues?.version_details || {}),
            tools: filteredInitialTools,
            meta: {
              ...(initialValues?.version_details?.meta || {}),
              attachment_toolkit_id: undefined,
            },
          }
        : {
            ...(initialValues?.version_details || {}),
            tools: filteredInitialTools,
          };
      resetForm({
        values: {
          ...(initialValues || {}),
          version_details: updatedInitialVersionDetails,
        },
      });
      setValues({
        ...(values || {}),
        version_details: updatedCurrentVersionDetails,
      });
      if (!dirty) {
        setRefetch();
      }
    },
    [dirty, initialValues, resetForm, setRefetch, setValues, values],
  );

  const handleApplicationRelationRemoval = useCallback(
    async (tool, updatedInitialVersionDetails) => {
      try {
        const result = await updateApplicationRelation({
          projectId,
          selectedApplicationId: tool.settings?.application_id,
          selectedVersionId: tool.settings?.application_version_id,
          application_id: applicationId,
          version_id: versionId,
          has_relation: false,
        }).unwrap();
        if (!result?.error) {
          onRemoveTool(tool);
          applyToolRemoval(tool, index);
          reset();
          if (isFromPipeline) {
            await savePipelineAfterToolkitRemoval(updatedInitialVersionDetails, tool);
          }
        } else {
          toastError(
            buildErrorMessage(
              result?.error?.data?.error || result?.error?.message || 'Failed to update application relation',
            ),
          );
        }
      } catch (error) {
        if (isStaleVersionReferenceError(error)) {
          invalidateCacheAndRefresh();
          toastInfo('Tool reference was outdated. Page has been refreshed with current state.');
          reset();
        } else {
          toastError(buildErrorMessage(error));
        }
      }
    },
    [
      applicationId,
      applyToolRemoval,
      index,
      invalidateCacheAndRefresh,
      isFromPipeline,
      onRemoveTool,
      projectId,
      reset,
      savePipelineAfterToolkitRemoval,
      toastError,
      toastInfo,
      updateApplicationRelation,
      versionId,
    ],
  );

  const onDisassociateTool = useCallback(
    async ({ tool, isAttachmentToolkit }) => {
      // Compute updated initialVersionDetails before any state mutations so we can use it
      // as the base for the pipeline auto-save (last-saved state minus the removed toolkit).
      const filteredInitialTools = (initialValues?.version_details?.tools || []).filter(
        t => t.id !== tool.id,
      );
      const updatedInitialVersionDetails = isAttachmentToolkit
        ? {
            ...(initialValues?.version_details || {}),
            tools: filteredInitialTools,
            meta: {
              ...(initialValues?.version_details?.meta || {}),
              attachment_toolkit_id: undefined,
            },
          }
        : {
            ...(initialValues?.version_details || {}),
            tools: filteredInitialTools,
          };

      if (applicationId && tool?.id && versionId) {
        if (tool.type !== 'application') {
          // For regular toolkits, use the disassociate API
          const result = await disassociateToolkit({
            projectId,
            toolkitId: tool?.id,
            entity_version_id: versionId,
            entity_id: applicationId,
            entity_type: 'agent',
            has_relation: false,
          });

          if (!result.error) {
            onRemoveTool(tool);
            applyToolRemoval(tool, index, isAttachmentToolkit);
            reset();
            if (isAttachmentToolkit) {
              onDeleteAttachmentTool?.();
            }
            if (isFromPipeline) {
              await savePipelineAfterToolkitRemoval(updatedInitialVersionDetails, tool, isAttachmentToolkit);
            }
          } else {
            toastError(
              buildErrorMessage(
                result?.error?.data?.error ||
                  result?.error?.message ||
                  'Failed to update application relation',
              ),
            );
          }
        } else {
          // For agents and pipelines (type 'application'), use the relation API
          await handleApplicationRelationRemoval(tool, updatedInitialVersionDetails);
        }
      } else {
        await handleApplicationRelationRemoval(tool, updatedInitialVersionDetails);
      }
    },
    [
      applicationId,
      applyToolRemoval,
      disassociateToolkit,
      handleApplicationRelationRemoval,
      index,
      initialValues,
      isFromPipeline,
      onDeleteAttachmentTool,
      onRemoveTool,
      projectId,
      reset,
      savePipelineAfterToolkitRemoval,
      toastError,
      versionId,
    ],
  );

  return { onDisassociateTool, isLoading, isDisassociateError, disassociateError };
};
