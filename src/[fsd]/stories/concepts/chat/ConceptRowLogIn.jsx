// Chat concept: «Log in» as a button on a row of the «who answers» list, in the place and look of «Fix», so every row
// with a problem has its action in one place, on the right. Today the same sign-in is a link «Log in.» in the row's
// warning line; each row button copies the «Log in» part of that link and starts the same sign-in. The links'
// «Log out.» is left out: a row shows its warning only while the user is logged out.
import { memo } from 'react';

import McpLogInRowButton from './McpLogInRowButton';
import OpenApiLogInRowButton from './OpenApiLogInRowButton';
import SharepointLogInRowButton from './SharepointLogInRowButton';

// The row's «Log in» for the sign-in logInOnRow named
const ConceptRowLogIn = memo(props => {
  const { kind, participant, status, details, disabled } = props;
  const projectId = participant.entity_meta?.project_id;
  const toolkitId = participant.entity_meta?.id;
  if (kind === 'mcp')
    return (
      <McpLogInRowButton
        values={details}
        disabled={disabled}
      />
    );
  if (kind === 'sharepoint')
    return (
      <SharepointLogInRowButton
        projectId={projectId}
        spConfig={status.spConfig}
        toolkitId={toolkitId}
        disabled={disabled}
      />
    );
  if (kind === 'openapi')
    return (
      <OpenApiLogInRowButton
        projectId={projectId}
        openApiConfig={status.openApiConfig}
        toolkitId={toolkitId}
        disabled={disabled}
      />
    );
  return null;
});

ConceptRowLogIn.displayName = 'ConceptRowLogIn';

export default ConceptRowLogIn;
