import { useCallback } from 'react';

import { useFormikContext } from 'formik';

import { useLazyApplicationDetailsQuery, useUpdateApplicationRelationMutation } from '@/api/applications';
import FlowIcon from '@/assets/flow-icon.svg?react';
import { buildErrorMessage } from '@/common/utils';
import ApplicationsIcon from '@/components/Icons/ApplicationsIcon';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

import { useSetRefetchDetails } from './useRefetchAgentDetails';

/**
 * Custom hook to handle association of agents and pipelines as "toolkits"
 */
export const useAgentPipelineAssociation = (applicationId, versionId) => {
  const projectId = useSelectedProjectId();
  const { toastSuccess, toastError } = useToast();
  const { values, setFieldValue, resetForm, dirty } = useFormikContext();
  const { setRefetch } = useSetRefetchDetails();

  // Get current application details to determine context for success messages
  const [fetchApplicationDetails] = useLazyApplicationDetailsQuery();

  // New API mutation for application relation
  const [updateApplicationRelation] = useUpdateApplicationRelationMutation();

  // Handle agent association - adds agent as a "toolkit" to the application
  const handleAssociateAgent = useCallback(
    async (agent, isPipeline = false) => {
      if (!applicationId || !versionId) {
        toastError('Application ID and Version ID are required to associate agent');
        return;
      }

      const { data: selectedApplication } = await fetchApplicationDetails({
        projectId,
        applicationId: agent.id,
      });

      // Block swarm agents from being added as tools
      const internalTools = selectedApplication?.version_details?.meta?.internal_tools || [];
      if (internalTools.includes('swarm')) {
        toastError(
          `"${agent.name}" has Swarm Mode enabled and cannot be added as a tool. ` +
            `Swarm agents are only supported in direct chat.`,
        );
        return;
      }

      try {
        const currentTools = values?.version_details?.tools || [];

        // Check if agent/pipeline is already added to prevent duplicates
        const existingTool = currentTools.find(
          tool => tool.type === 'application' && tool.settings?.application_id === selectedApplication.id,
        );

        if (!existingTool) {
          // Use the new API to create the relation
          const result = await updateApplicationRelation({
            projectId,
            selectedApplicationId: selectedApplication.id,
            selectedVersionId: selectedApplication.version_details?.id,
            application_id: applicationId,
            version_id: versionId,
            has_relation: true,
          }).unwrap();
          if (!result.error) {
            // Update the local form state to reflect the new tool
            if (dirty) {
              setFieldValue(`version_details.tools`, [
                ...currentTools,
                {
                  id: result.tool_id, // Store the tool_id returned from API
                  type: 'application', // Use 'application' as the type for agents/pipelines
                  name: selectedApplication.name,
                  description: selectedApplication.description || '',
                  agent_type: selectedApplication.version_details?.agent_type,
                  icon_meta: selectedApplication.version_details?.icon_meta || {},
                  settings: {
                    application_id: selectedApplication.id, // Use agent ID for application_id
                    application_version_id: selectedApplication.version_details?.id,
                  },
                  author: selectedApplication.version_details?.author || {},
                  author_id: selectedApplication.version_details?.author?.id,
                  variables: (selectedApplication.version_details?.variables || []).map(
                    ({ name, value }) => ({
                      name,
                      value,
                    }),
                  ),
                },
              ]);
            } else {
              resetForm({
                values: {
                  ...(values || {}),
                  version_details: {
                    ...(values.version_details || {}),
                    tools: [
                      ...(values.version_details.tools || []),
                      {
                        id: result.tool_id, // Store the tool_id returned from API
                        type: 'application',
                        name: selectedApplication.name,
                        description: selectedApplication.description || '',
                        agent_type: selectedApplication.version_details?.agent_type,
                        icon_meta: selectedApplication.version_details?.icon_meta || {},
                        settings: {
                          application_id: selectedApplication.id,
                          application_version_id: selectedApplication.version_details?.id,
                        },
                        author: selectedApplication.version_details?.author || {},
                        author_id: selectedApplication.version_details?.author?.id,
                        variables: (selectedApplication.version_details?.variables || []).map(
                          ({ name, value }) => ({
                            name,
                            value,
                          }),
                        ),
                      },
                    ],
                  },
                },
              });
              setRefetch();
            }
            // Create context-aware success message
            toastSuccess(
              `The "${agent.name}" ${isPipeline ? 'pipeline' : 'agent'} is successfully added to the ${values?.name || 'application'} ${values?.version_details?.agent_type === 'pipeline' ? 'pipeline' : 'agent'}.`,
            );
          } else {
            toastError(buildErrorMessage(result.error?.data?.error || result.error));
          }
        } else {
          toastError(
            `The "${agent.name}" ${isPipeline ? 'pipeline' : 'agent'} is already added to this ${values?.version_details?.agent_type === 'pipeline' ? 'pipeline' : 'agent'}.`,
          );
        }
      } catch (error) {
        toastError(`Failed to add agent: ${error.message || 'Unknown error'}`);
      }
    },
    [
      applicationId,
      dirty,
      fetchApplicationDetails,
      projectId,
      resetForm,
      setFieldValue,
      setRefetch,
      toastError,
      toastSuccess,
      updateApplicationRelation,
      values,
      versionId,
    ],
  );

  // Get icon for agent/pipeline tools
  const getToolIcon = useCallback((toolType, size = '16px') => {
    if (toolType === 'agent') {
      return (
        <ApplicationsIcon
          style={{ width: size, height: size }}
          fill="#FFFFFF"
        />
      );
    } else if (toolType === 'pipeline') {
      return (
        <FlowIcon
          style={{ width: size, height: size }}
          fill="#FFFFFF"
        />
      );
    }
    return null;
  }, []);

  return {
    handleAssociateAgent,
    getToolIcon,
  };
};
