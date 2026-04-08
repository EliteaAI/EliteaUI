export const getSharepointConnectionTokenKey = ({ oauthEndpoint, configUuid, siteUrl }) => {
  if (oauthEndpoint) {
    return configUuid ? `${configUuid}:${oauthEndpoint}` : oauthEndpoint;
  }
  return configUuid && siteUrl ? `${configUuid}:${siteUrl}` : siteUrl;
};
