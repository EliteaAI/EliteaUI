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
    remoteMcpLoggedOut,
    spOAuthLoggedOut,
    participant,
    handleEditClick,
    isToolkitParticipant,
    type,
    originalDetails,
    entityMeta,
    spConfig,
  } = props;

  const styles = participantWarningStyles();

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
    if (type === ChatParticipantType.Datasources) return 'Please configure datasource chat settings';
    if (type === ChatParticipantType.Applications) return 'Please configure agent chat settings';

    return '';
  }

  if (mcpIsDisconnected) {
    return `The ${originalDetails.name} mcp server is disconnected. Reconnect it to use.`;
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
