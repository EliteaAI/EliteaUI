import { useCallback } from 'react';

import { useFormikContext } from 'formik';
import { useDispatch } from 'react-redux';

import { useSetRefetchDetails } from '@/[fsd]/features/agent/lib/hooks/useRefetchAgentDetails.hooks';
import { TAG_TYPE_APPLICATION_DETAILS, useUpdateApplicationRelationMutation } from '@/api/applications';
import { eliteaApi } from '@/api/eliteaApi';
import { useToolkitAssociateMutation } from '@/api/toolkits';
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
  const { onRemoveTool } = usePipelineToolsChanges();
  const { setRefetch } = useSetRefetchDetails();
  const { toastError, toastInfo } = useToast();
  const { resetForm, setValues, values, initialValues, dirty } = useFormikContext();
  const [disassociateToolkit, { isLoading, isError: isDisassociateError, error: disassociateError, reset }] =
    useToolkitAssociateMutation();
  const [updateApplicationRelation] = useUpdateApplicationRelationMutation();

  // Helper function to invalidate cache and trigger refetch
  const invalidateCacheAndRefresh = useCallback(() => {
    dispatch(eliteaApi.util.invalidateTags([TAG_TYPE_APPLICATION_DETAILS]));
    setRefetch();
  }, [dispatch, setRefetch]);

  const onDisassociateTool = useCallback(
    async ({ tool, isAttachmentToolkit }) => {
      if (applicationId && tool?.id && versionId) {
        // For regular toolkits, use the disassociate API
        if (tool.type !== 'application') {
          const result = await disassociateToolkit({
            projectId,
            toolkitId: tool?.id,
            entity_version_id: versionId,
            entity_id: applicationId,
            entity_type: 'agent',
            has_relation: false, // This removes the association
          });

          // Update cache to remove the tool from the application
          if (!result.error) {
            onRemoveTool(tool);
            // Filter toolkit from current values (by index) and from the server baseline (by id).
            // resetForm sets initialValues to the server baseline without the toolkit so that
            // Discard does not restore it. setValues then re-applies the user's current changes,
            // preserving other pending edits and keeping dirty=true when applicable.
            const filteredCurrentTools = (values.version_details?.tools || []).filter((_, i) => i !== index);
            const filteredInitialTools = (initialValues?.version_details?.tools || []).filter(
              t => t.id !== tool.id,
            );
            const updatedCurrentVersionDetails = !isAttachmentToolkit
              ? {
                  ...(values.version_details || {}),
                  tools: filteredCurrentTools,
                }
              : {
                  ...(values.version_details || {}),
                  tools: filteredCurrentTools,
                  meta: {
                    ...(values.version_details?.meta || {}),
                    attachment_toolkit_id: undefined,
                  },
                };
            const updatedInitialVersionDetails = !isAttachmentToolkit
              ? {
                  ...(initialValues?.version_details || {}),
                  tools: filteredInitialTools,
                }
              : {
                  ...(initialValues?.version_details || {}),
                  tools: filteredInitialTools,
                  meta: {
                    ...(initialValues?.version_details?.meta || {}),
                    attachment_toolkit_id: undefined,
                  },
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
            reset();
            if (isAttachmentToolkit) {
              onDeleteAttachmentTool?.();
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
          // For agents and pipelines (type 'application'), use the new API to remove relation
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
              const filteredCurrentTools = (values.version_details?.tools || []).filter(
                (_, i) => i !== index,
              );
              const filteredInitialTools = (initialValues?.version_details?.tools || []).filter(
                t => t.id !== tool.id,
              );
              resetForm({
                values: {
                  ...(initialValues || {}),
                  version_details: {
                    ...(initialValues?.version_details || {}),
                    tools: filteredInitialTools,
                  },
                },
              });
              setValues({
                ...(values || {}),
                version_details: {
                  ...(values.version_details || {}),
                  tools: filteredCurrentTools,
                },
              });
              if (!dirty) {
                setRefetch();
              }
              reset();
            } else {
              toastError(
                buildErrorMessage(
                  result?.error?.data?.error ||
                    result?.error?.message ||
                    'Failed to update application relation',
                ),
              );
            }
          } catch (error) {
            // Check if error is due to stale version reference (version was already deleted/replaced)
            // In this case, the local state is out of sync with the backend - trigger a refresh
            if (isStaleVersionReferenceError(error)) {
              // The tool reference was outdated - force invalidate cache and refresh from server
              invalidateCacheAndRefresh();
              toastInfo('Tool reference was outdated. Page has been refreshed with current state.');
              reset();
            } else {
              toastError(buildErrorMessage(error));
            }
          }
        }
      } else {
        // Fallback for local state update when no applicationId
        // For agents and pipelines (type 'application'), use the new API to remove relation
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
            const filteredCurrentTools = (values.version_details?.tools || []).filter((_, i) => i !== index);
            const filteredInitialTools = (initialValues?.version_details?.tools || []).filter(
              t => t.id !== tool.id,
            );
            resetForm({
              values: {
                ...(initialValues || {}),
                version_details: {
                  ...(initialValues?.version_details || {}),
                  tools: filteredInitialTools,
                },
              },
            });
            setValues({
              ...(values || {}),
              version_details: {
                ...(values.version_details || {}),
                tools: filteredCurrentTools,
              },
            });
            if (!dirty) {
              setRefetch();
            }
            reset();
          } else {
            toastError(
              buildErrorMessage(
                result?.error?.data?.error ||
                  result?.error?.message ||
                  'Failed to update application relation',
              ),
            );
          }
        } catch (error) {
          // Check if error is due to stale version reference (version was already deleted/replaced)
          // In this case, the local state is out of sync with the backend - trigger a refresh
          if (isStaleVersionReferenceError(error)) {
            // The tool reference was outdated - force invalidate cache and refresh from server
            invalidateCacheAndRefresh();
            toastInfo('Tool reference was outdated. Page has been refreshed with current state.');
            reset();
          } else {
            toastError(buildErrorMessage(error));
          }
        }
      }
    },
    [
      applicationId,
      dirty,
      disassociateToolkit,
      index,
      initialValues,
      projectId,
      reset,
      resetForm,
      setRefetch,
      setValues,
      toastError,
      toastInfo,
      onRemoveTool,
      updateApplicationRelation,
      values,
      versionId,
      onDeleteAttachmentTool,
      invalidateCacheAndRefresh,
    ],
  );

  return { onDisassociateTool, isLoading, isDisassociateError, disassociateError };
};
