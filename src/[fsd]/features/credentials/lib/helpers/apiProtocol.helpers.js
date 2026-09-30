import { API_PROTOCOL_CREDENTIAL_TYPES } from '../constants/apiProtocol.constants.js';

export const isApiProtocolCredentialType = type =>
  API_PROTOCOL_CREDENTIAL_TYPES.includes(String(type || '').toLowerCase());

export const findCredentialType = (configurations, credentialValue, personalProjectId) => {
  const eliteaTitle = credentialValue?.elitea_title;
  if (!eliteaTitle || !Array.isArray(configurations)) return '';
  const wantsPrivate = credentialValue?.private;
  // personal and project credentials can share a title, so also match on private/project_id
  const match = configurations.find(config => {
    if (config?.elitea_title !== eliteaTitle) return false;
    if (wantsPrivate === undefined) return true;
    return !!wantsPrivate === (config.project_id === personalProjectId);
  });
  return match?.type || '';
};

// a stable identity for the attached credential: the value object is rebuilt on every form edit
export const credentialKeyOf = credentialValue =>
  credentialValue ? `${credentialValue.elitea_title || ''}|${!!credentialValue.private}` : '';
