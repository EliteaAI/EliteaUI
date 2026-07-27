import { memo } from 'react';

import { Typography } from '@mui/material';

import { McpLogInLink } from '@/[fsd]/features/mcp/ui';
import { SharepointLogInLink } from '@/[fsd]/features/sharepoint/ui';
import { ChatParticipantType } from '@/common/constants';

const ParticipantWarning = memo(props => {
  const {
    isPublishedAgentGone,
    isVersionUnavailable,
    hasMisconfigurationErrors,
    shouldDisableThisItem,
    mcpIsDisconnected,
    someToolsAreUnavailable,
    blockedToolkitNames,
    remoteMcpLoggedOut,
    spOAuthLoggedOut,
    isSkippedContainer,
    participant,
    handleEditClick,
    isToolkitParticipant,
    type,
    originalDetails,
    entityMeta,
    spConfig,
  } = props;

  const styles = participantWarningStyles();

  // Informational (NOT an error): a non-pipeline "container" agent whose own sub-agent chain is
  // already at the tier budget, attached to a chat but not the active agent, is not bound as a
  // callable tool in adhoc chat because nesting it would exceed the 3-tier limit (issue #5778,
  // relaxing #5680's absolute ban). A container that still fits IS bound and shows no notice
  // (isSkippedContainerParticipant is now depth-aware). This is the single source of the notice
  // text; ParticipantItem renders it with a neutral (info) severity so a correct container never
  // reads as broken. Errors below keep the amber attention treatment.
  if (isSkippedContainer)
    return 'Its sub-agent chain is at the nesting limit (3 tiers), so it runs only as the active agent here — select it to run.';

  if (isPublishedAgentGone) return 'Published agent is no longer available';

  if (isVersionUnavailable) return 'Published version not available, select another version';

  if (hasMisconfigurationErrors) {
    const isPipelineAgent = participant.entity_settings?.agent_type === 'pipeline';

    const getParticipantTypeText = () => {
      if (participant.entity_name === ChatParticipantType.Applications && !isPipelineAgent) return 'agent';

      return isToolkitParticipant ? 'toolkit' : 'pipeline';
    };

    return (
      <>
        {'Misconfiguration errors found. '}
        <Typography
          component="button"
          variant="bodySmall"
          onClick={handleEditClick}
          sx={styles.misconfigurationError}
        >
          {`Check the ${getParticipantTypeText()}`}
        </Typography>
        .
      </>
    );
  }

  if (shouldDisableThisItem) {
    if (type === ChatParticipantType.Applications) return 'Please configure agent chat settings';

    return '';
  }

  if (mcpIsDisconnected) {
    return `The ${originalDetails.name} mcp server is disconnected. Reconnect it to use.`;
  }

  if (blockedToolkitNames?.length) {
    const plural = blockedToolkitNames.length > 1 ? 's are' : ' is';
    return `${blockedToolkitNames.join(', ')} toolkit${plural} blocked by your organization.`;
  }

  if (someToolsAreUnavailable) {
    return 'Some tools of some toolkit are not available anymore.';
  }

  if (remoteMcpLoggedOut) {
    return (
      <>
        {'Server is disconnected!  Reconnect it to use. '}
        <McpLogInLink values={originalDetails} />
      </>
    );
  }

  if (spOAuthLoggedOut) {
    return (
      <>
        {'SharePoint requires authorization. '}
        <SharepointLogInLink
          projectId={entityMeta?.project_id}
          spConfig={spConfig}
          toolkitId={entityMeta?.id}
        />
      </>
    );
  }

  return '';
});

ParticipantWarning.displayName = 'ParticipantWarning';

/** @type {MuiSx} */
const participantWarningStyles = () => ({
  misconfigurationError: {
    textDecoration: 'underline',
    cursor: 'pointer',
    color: 'primary.main',
    border: 'none',
    background: 'none',
    padding: 0,
    font: 'inherit',
    display: 'inline',

    '&:hover': {
      color: 'primary.dark',
    },
  },
});

export default ParticipantWarning;
