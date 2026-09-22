import {
  API_PROTOCOL_CREDENTIAL_TYPES,
  API_PROTOCOL_MODEL_PATTERNS,
} from '../constants/apiProtocol.constants.js';

export const isApiProtocolCredentialType = type =>
  API_PROTOCOL_CREDENTIAL_TYPES.includes(String(type || '').toLowerCase());

export const findCredentialType = (configurations, credentialValue) => {
  const eliteaTitle = credentialValue?.elitea_title;
  if (!eliteaTitle || !Array.isArray(configurations)) return '';
  const match = configurations.find(config => config?.elitea_title === eliteaTitle);
  return match?.type || '';
};

export const resolveApiProtocolForModel = modelName => {
  const name = String(modelName || '');
  if (!name) return '';
  return API_PROTOCOL_MODEL_PATTERNS.find(({ pattern }) => pattern.test(name))?.protocol || '';
};
