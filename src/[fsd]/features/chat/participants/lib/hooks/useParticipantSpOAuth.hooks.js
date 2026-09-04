import { useMcpTokenChange } from '@/[fsd]/features/mcp';
import { useResolvedSharepointConfig } from '@/[fsd]/features/sharepoint';

export const useParticipantSpOAuth = ({
  participant,
  originalDetails,
  entity_meta,
  isToolkitParticipant,
}) => {
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

  return { spConfig, spOAuthLoggedIn, spOAuthLoggedOut: !!spConfig && !spOAuthLoggedIn };
};
