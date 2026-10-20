// Toolkit types whose credential keeps a Microsoft login in the vault, and how each one's login is keyed.
// Dataverse's 401 carries the Entra authority as server_url; the others use the credential's discovery endpoint.
// Dataverse drops the browser token after saving; the others keep it so chat and the credential page work as before.
const authorityFromServerUrl = (_credential, errorData) => errorData.auth_metadata?.server_url;
const authorityFromDiscoveryEndpoint = credential => credential.data?.oauth_discovery_endpoint;

const STORED_LOGIN_TOOLKITS = {
  dataverse: {
    configurationType: 'dataverse',
    settingsKey: 'dataverse_configuration',
    getAuthority: authorityFromServerUrl,
    keepBrowserToken: false,
  },
  outlook: {
    configurationType: 'outlook',
    settingsKey: 'outlook_configuration',
    getAuthority: authorityFromDiscoveryEndpoint,
    keepBrowserToken: true,
  },
  teams: {
    configurationType: 'teams',
    settingsKey: 'teams_configuration',
    getAuthority: authorityFromDiscoveryEndpoint,
    keepBrowserToken: true,
  },
};

export const getStoredLoginConfig = toolkitType => STORED_LOGIN_TOOLKITS[toolkitType] ?? null;

// Validation reports a rejected saved login as a connection error whose message asks the user to log in.
const LOGIN_REQUIRED_PATTERN = /sign in|log in|authori[sz]ation|oauth flow/i;

export const isLoginExpired = errorMessage =>
  typeof errorMessage === 'string' && LOGIN_REQUIRED_PATTERN.test(errorMessage);
