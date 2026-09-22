import {
  API_PROTOCOL_CREDENTIAL_TYPES,
  API_PROTOCOL_MODEL_PATTERNS,
} from '../constants/apiProtocol.constants.js';

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

export const resolveApiProtocolForModel = modelName => {
  const name = String(modelName || '');
  if (!name) return '';
  return API_PROTOCOL_MODEL_PATTERNS.find(({ pattern }) => pattern.test(name))?.protocol || '';
};
