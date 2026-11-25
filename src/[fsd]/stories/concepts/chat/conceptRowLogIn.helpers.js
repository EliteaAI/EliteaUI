// Which sign-in a row asks for — exactly when the team's warning line would end with its «Log in.» link, so the same
// order of checks as ParticipantWarning: a row never has both «Fix» and «Log in». Read by ParticipantWarning.swap.
export const logInOnRow = status => {
  const before =
    status.isSkippedContainer ||
    status.isPublishedAgentGone ||
    status.isVersionUnavailable ||
    status.isSkillGone ||
    status.isSkillVersionUnavailable ||
    status.hasMisconfigurationErrors ||
    status.shouldDisableThisItem ||
    status.mcpIsDisconnected ||
    status.blockedToolkitNames?.length ||
    status.someToolsAreUnavailable;
  if (before) return null;
  if (status.remoteMcpLoggedOut) return 'mcp';
  if (status.spOAuthLoggedOut) return 'sharepoint';
  if (status.openApiOAuthLoggedOut) return 'openapi';
  return null;
};

// The warning line of such a row: the team's text without the link
export const LOG_IN_TEXT = {
  mcp: 'Server is disconnected! Reconnect it to use.',
  sharepoint: 'SharePoint requires authorization.',
  openapi: 'OpenAPI requires authorization.',
};
