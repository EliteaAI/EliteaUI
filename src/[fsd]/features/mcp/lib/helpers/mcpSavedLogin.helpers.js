import { canonicalizeServerUrl } from './mcpAuth.helpers';

// A saved login only fits the server it was made for
export const isLoginForServer = (credential, serverUrl) =>
  Boolean(credential?.data?.url && serverUrl) &&
  canonicalizeServerUrl(credential.data.url) === canonicalizeServerUrl(serverUrl);

export const hasSavedMcpLogin = credential => Boolean(credential?.data?.refresh_token);
