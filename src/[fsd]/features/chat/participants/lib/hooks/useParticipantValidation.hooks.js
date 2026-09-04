import { ChatParticipantType } from '@/common/constants';
import useValidateApplicationVersion, {
  useToolsValidationInfo,
} from '@/hooks/application/useValidateApplicationVersion';
import useValidateToolkit, { useToolkitValidationInfo } from '@/hooks/application/useValidateToolkit';

export const useParticipantValidation = ({
  participant,
  originalDetails,
  entity_meta,
  type,
  isToolkitParticipant,
  isPublishedParticipant,
}) => {
  useValidateApplicationVersion(
    !isPublishedParticipant &&
      (type === ChatParticipantType.Applications || type === ChatParticipantType.Pipelines) &&
      originalDetails?.version_details?.tools
      ? {
          applicationId: entity_meta?.id,
          projectId: entity_meta?.project_id,
          versionId: participant.entity_settings?.version_id,
        }
      : {},
  );

  useValidateToolkit(
    isToolkitParticipant
      ? { toolkitId: entity_meta?.id, projectId: entity_meta?.project_id, forceSkip: !isToolkitParticipant }
      : {},
  );

  const { totalValidationInfo } = useToolsValidationInfo({
    applicationId: isPublishedParticipant ? undefined : entity_meta?.id,
    projectId: entity_meta?.project_id,
    versionId: participant.entity_settings?.version_id,
    tools: isPublishedParticipant ? [] : originalDetails?.version_details?.tools || [],
  });

  const { toolkitValidationInfoList } = useToolkitValidationInfo(
    isToolkitParticipant ? { projectId: entity_meta?.project_id, toolkitId: entity_meta?.id } : {},
  );

  return {
    hasMisconfigurationErrors: totalValidationInfo?.length > 0 || toolkitValidationInfoList?.length > 0,
  };
};
