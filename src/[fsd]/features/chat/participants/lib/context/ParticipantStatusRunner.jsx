import { memo, useEffect } from 'react';

import { isParticipantOKForChat } from '@/[fsd]/features/chat/participants/lib/helpers';
import {
  useParticipantMcpStatus,
  useParticipantOpenApiOAuth,
  useParticipantSpOAuth,
  useParticipantToolAvailability,
  useParticipantValidation,
} from '@/[fsd]/features/chat/participants/lib/hooks';
import { ChatParticipantType, PUBLIC_PROJECT_ID } from '@/common/constants';

const ParticipantStatusRunner = memo(props => {
  const { cacheKey, participant, originalDetails, hasFetchedDetails, setParticipantStatus, updateDetails } =
    props;

  const { entity_meta, entity_name: type } = participant;
  const isToolkitParticipant = type === ChatParticipantType.Toolkits;
  const isPublishedParticipant = entity_meta?.project_id == PUBLIC_PROJECT_ID;

  const shared = { participant, originalDetails, entity_meta, type, isToolkitParticipant };

  const { hasMisconfigurationErrors } = useParticipantValidation({ ...shared, isPublishedParticipant });
  const { hasRemoteMcpLoggedIn, mcpIsDisconnected, remoteMcpLoggedOut } = useParticipantMcpStatus({
    ...shared,
    updateDetails,
  });
  const { someToolsAreUnavailable, blockedToolkitNames } = useParticipantToolAvailability(shared);
  const { spConfig, spOAuthLoggedIn, spOAuthLoggedOut } = useParticipantSpOAuth(shared);
  const { openApiConfig, openApiTokenKey, openAPIOAuthLoggedIn, openApiOAuthLoggedOut } =
    useParticipantOpenApiOAuth(shared);

  const shouldDisableThisItem = !isParticipantOKForChat(participant);

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
    openApiOAuthLoggedOut ||
    someToolsAreUnavailable ||
    blockedToolkitNames.length > 0 ||
    isPublishedAgentGone ||
    isVersionUnavailable;

  useEffect(() => {
    setParticipantStatus(cacheKey, {
      hasError,
      shouldDisableThisItem,
      hasMisconfigurationErrors,
      someToolsAreUnavailable,
      blockedToolkitNames,
      isPublishedAgentGone,
      isVersionUnavailable,
      mcpIsDisconnected,
      remoteMcpLoggedOut,
      hasRemoteMcpLoggedIn,
      spOAuthLoggedOut,
      spOAuthLoggedIn,
      spConfig,
      openAPIOAuthLoggedIn,
      openApiOAuthLoggedOut,
      openApiConfig,
      openApiTokenKey,
    });
  }, [
    cacheKey,
    setParticipantStatus,
    hasError,
    shouldDisableThisItem,
    hasMisconfigurationErrors,
    someToolsAreUnavailable,
    blockedToolkitNames,
    isPublishedAgentGone,
    isVersionUnavailable,
    mcpIsDisconnected,
    remoteMcpLoggedOut,
    hasRemoteMcpLoggedIn,
    spOAuthLoggedOut,
    spOAuthLoggedIn,
    spConfig,
    openAPIOAuthLoggedIn,
    openApiOAuthLoggedOut,
    openApiConfig,
    openApiTokenKey,
  ]);

  return null;
});

ParticipantStatusRunner.displayName = 'ParticipantStatusRunner';

export default ParticipantStatusRunner;
