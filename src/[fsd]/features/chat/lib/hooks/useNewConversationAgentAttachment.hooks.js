import { useCallback } from 'react';

import { useSelector } from 'react-redux';

import {
  useLazyGetConfigurationsListQuery,
  useLazyToolkitsDetailsQuery,
  useLazyToolkitsListQuery,
  useToolkitCreateMutation,
} from '@/api';
import { ChatParticipantType } from '@/common/constants';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

export const useNewConversationAgentAttachment = () => {
  const selectedProjectId = useSelectedProjectId();

  const [getToolkits] = useLazyToolkitsListQuery();
  const [fetchToolkitDetails] = useLazyToolkitsDetailsQuery();
  const [onCreate] = useToolkitCreateMutation();
  const [getConfigurations] = useLazyGetConfigurationsListQuery();
  const { personal_project_id } = useSelector(state => state.user);

  const convertToolkitToparticipant = useCallback(
    ({ details }) => {
      if (Object.keys(details).length) {
        return {
          ...details,
          entity_name: details.participantType,
          entity_meta: { id: details.id, project_id: selectedProjectId },
          entity_settings: {
            icon_meta: details.icon_meta,
            toolkit_type: details.type,
          },
          meta: { name: details.name, mcp: details.meta?.mcp, added_from_agent: true },
          // Store the original latest version ID for comparison later
          originalLatestVersionId: details.version_details?.id,
        };
      }
    },
    [selectedProjectId],
  );

  const getAttachmentToolkitFromAgent = useCallback(
    async participantDetails => {
      if (!participantDetails) return;

      const isAgent = participantDetails.participantType === ChatParticipantType.Applications;
      const attachmentToolkitID = participantDetails?.version_details?.meta?.attachment_toolkit_id;

      if (!isAgent || !attachmentToolkitID) return;

      const projectId = participantDetails?.entity_meta?.project_id;

      if (projectId && attachmentToolkitID) {
        const attachmentToolkitDetails = await fetchToolkitDetails({
          projectId,
          toolkitId: attachmentToolkitID,
        }).unwrap();
        const toolkitList = await getToolkits({
          projectId: selectedProjectId,
        }).unwrap();

        let existentToolkit = toolkitList.rows.find(
          toolkitItem =>
            toolkitItem.name === attachmentToolkitDetails.name && toolkitItem.type === 'artifact',
        );

        if (!existentToolkit) {
          const { data } = await getConfigurations({
            projectId: selectedProjectId,
            page: 0,
            pageSize: 500,
            sharedOffset: 0,
            sharedLimit: 500,
            includeShared: false,
            section: 'vectorstorage',
          });

          const appropriateConfiguration =
            data.items.find(pg => pg.elitea_title === 'elitea-pgvector') ??
            data.items.find(pg => pg.project_id === selectedProjectId);

          if (appropriateConfiguration) {
            const toolkitData = {
              projectId: selectedProjectId,
              name: attachmentToolkitDetails.toolkit_name,
              description: attachmentToolkitDetails.description,
              settings: {
                ...attachmentToolkitDetails.settings,
                pgvector_configuration: {
                  elitea_title: appropriateConfiguration?.label,
                  private: appropriateConfiguration?.project_id === personal_project_id,
                },
              },
              type: attachmentToolkitDetails.type,
            };

            existentToolkit = await onCreate(toolkitData).unwrap();
          }
        }

        return existentToolkit ?? null;
      }
    },
    [fetchToolkitDetails, getConfigurations, getToolkits, onCreate, personal_project_id, selectedProjectId],
  );

  const handleAttachmentToolkitFromAgent = useCallback(
    async activeParticipant => {
      const attachmentToolkit = await getAttachmentToolkitFromAgent(activeParticipant);

      if (attachmentToolkit) {
        const attachmentToolkitParticipant = convertToolkitToparticipant({
          details: {
            ...attachmentToolkit,
            participantType: ChatParticipantType.Toolkits,
            version_details: { ...activeParticipant.version_details },
          },
        });

        return attachmentToolkitParticipant;
      }
    },
    [convertToolkitToparticipant, getAttachmentToolkitFromAgent],
  );

  return { handleAttachmentToolkitFromAgent };
};
