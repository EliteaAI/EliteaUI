import { memo, useCallback, useEffect, useMemo } from 'react';

import { isParticipantOKForChat } from '@/[fsd]/features/chat/participants/lib/helpers';
import { useMcpTokenChange } from '@/[fsd]/features/mcp/lib/hooks';
import { useGetToolkitNameFromSchema } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks/useGetToolkitNameFromSchema.hooks';
import { useResolvedSharepointConfig } from '@/[fsd]/features/sharepoint/lib/hooks/useResolvedSharepointConfig.hooks';
import { ChatParticipantType, PUBLIC_PROJECT_ID } from '@/common/constants';
import useValidateApplicationVersion, {
  useToolsValidationInfo,
} from '@/hooks/application/useValidateApplicationVersion';
import useValidateToolkit, { useToolkitValidationInfo } from '@/hooks/application/useValidateToolkit';
import useMCPParticipantStatusMonitor from '@/hooks/chat/useMCPParticipantStatusMonitor';

const ParticipantStatusRunner = memo(props => {
  const { cacheKey, participant, originalDetails, hasFetchedDetails, setParticipantStatus, updateDetails } =
    props;

  const { entity_meta, entity_name: type } = participant;

  const isToolkitParticipant = type === ChatParticipantType.Toolkits;
  const isPublishedParticipant = entity_meta?.project_id == PUBLIC_PROJECT_ID;

  //  Validation triggers (fire eagerly on mount)
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
      ? {
          toolkitId: entity_meta?.id,
          projectId: entity_meta?.project_id,
          forceSkip: !isToolkitParticipant,
        }
      : {},
  );

  //  MCP status monitoring via WebSocket
  const onMCPConnectionStatusChange = useCallback(
    connected => {
      updateDetails(type, entity_meta?.id, entity_meta?.project_id, prev => ({
        ...prev,
        online: connected,
      }));
    },
    [updateDetails, type, entity_meta?.id, entity_meta?.project_id],
  );

  useMCPParticipantStatusMonitor({
    projectId: entity_meta?.project_id,
    mcpType: originalDetails?.type,
    isMCP: originalDetails?.meta?.mcp,
    onMCPConnectionStatusChange,
  });

  //  Validation readers (from Redux)
  const { totalValidationInfo } = useToolsValidationInfo({
    applicationId: isPublishedParticipant ? undefined : entity_meta?.id,
    projectId: entity_meta?.project_id,
    versionId: participant.entity_settings?.version_id,
    tools: isPublishedParticipant ? [] : originalDetails?.version_details?.tools || [],
  });

  const { toolkitValidationInfoList } = useToolkitValidationInfo(
    isToolkitParticipant ? { projectId: entity_meta?.project_id, toolkitId: entity_meta?.id } : {},
  );

  //  Tool availability
  const { getSelectedTools } = useGetToolkitNameFromSchema();

  const someToolsAreUnavailable = useMemo(() => {
    if (type === ChatParticipantType.Applications || type === ChatParticipantType.Pipelines) {
      return !!originalDetails?.version_details?.tools?.find(tool => {
        const availableTools = getSelectedTools(tool?.type);
        return (
          !!availableTools?.length &&
          tool?.settings?.selected_tools?.some(item => !availableTools.includes(item))
        );
      });
    }
    return false;
  }, [getSelectedTools, originalDetails?.version_details?.tools, type]);

  // MCP token state
  const mcpServerUrl = participant.entity_settings?.mcp_server_url || originalDetails?.settings?.url || '';

  const { isLoggedIn: hasRemoteMcpLoggedIn } = useMcpTokenChange(
    isToolkitParticipant && participant?.entity_settings?.toolkit_type === 'mcp' ? mcpServerUrl : null,
  );

  // SharePoint OAuth
  const spConfigRef =
    isToolkitParticipant && participant.entity_settings?.toolkit_type === 'sharepoint'
      ? originalDetails?.settings?.sharepoint_configuration
      : null;
  const { spConfig, connectionTokenKey: spConnectionTokenKey } = useResolvedSharepointConfig(
    spConfigRef,
    entity_meta?.project_id,
  );
  const { isLoggedIn: spOAuthLoggedIn } = useMcpTokenChange(
    spConnectionTokenKey ? { serverUrl: spConnectionTokenKey } : null,
  );

  // Computed error flags
  const shouldDisableThisItem = !isParticipantOKForChat(participant);
  const hasMisconfigurationErrors = totalValidationInfo?.length > 0 || toolkitValidationInfoList?.length > 0;
  const mcpIsDisconnected = isToolkitParticipant && !!originalDetails?.meta?.mcp && !originalDetails?.online;

  const remoteMcpLoggedOut =
    isToolkitParticipant && participant?.entity_settings?.toolkit_type === 'mcp' && !hasRemoteMcpLoggedIn;

  const spOAuthLoggedOut = !!spConfig && !spOAuthLoggedIn;

  const isPublishedAgentGone =
    isPublishedParticipant && hasFetchedDetails && !originalDetails?.versions?.length;

  const isVersionUnavailable =
    isPublishedParticipant &&
    hasFetchedDetails &&
    originalDetails?.versions?.length > 0 &&
    !originalDetails.versions.some(v => v.id === participant.entity_settings?.version_id);

  const hasError =
    shouldDisableThisItem ||
    hasMisconfigurationErrors ||
    mcpIsDisconnected ||
    remoteMcpLoggedOut ||
    spOAuthLoggedOut ||
    someToolsAreUnavailable ||
    isPublishedAgentGone ||
    isVersionUnavailable;

  useEffect(() => {
    setParticipantStatus(cacheKey, {
      hasError,
      shouldDisableThisItem,
      hasMisconfigurationErrors,
      someToolsAreUnavailable,
      isPublishedAgentGone,
      isVersionUnavailable,
      mcpIsDisconnected,
      remoteMcpLoggedOut,
      hasRemoteMcpLoggedIn,
      spOAuthLoggedOut,
      spOAuthLoggedIn,
      spConfig,
    });
  }, [
    cacheKey,
    setParticipantStatus,
    hasError,
    shouldDisableThisItem,
    hasMisconfigurationErrors,
    someToolsAreUnavailable,
    isPublishedAgentGone,
    isVersionUnavailable,
    mcpIsDisconnected,
    remoteMcpLoggedOut,
    hasRemoteMcpLoggedIn,
    spOAuthLoggedOut,
    spOAuthLoggedIn,
    spConfig,
  ]);

  return null;
});

ParticipantStatusRunner.displayName = 'ParticipantStatusRunner';

export default ParticipantStatusRunner;
