import { ToolBaseHelpers } from '@/[fsd]/features/toolkits/lib/helpers';

export const extractInformationFromCredentialError = ({ error, schemaProperties, settings }) => {
  const newErrors = {};
  if (typeof error.data?.message === 'string') {
    const normalizedMessage = error.data?.message.toLowerCase();
    for (const key of Object.keys(schemaProperties)) {
      if (
        normalizedMessage.includes((schemaProperties[key]?.title || '').toLowerCase()) ||
        normalizedMessage.includes((schemaProperties[key]?.description || '').toLowerCase()) ||
        (typeof settings[key] === 'string' && normalizedMessage.includes(settings[key].toLowerCase())) ||
        normalizedMessage.includes(key.toLowerCase())
      ) {
        newErrors[key] = error.data?.message;
      } else if (
        normalizedMessage.includes('authentication') &&
        ToolBaseHelpers.isSecretField(
          key,
          schemaProperties[key]?.format,
          schemaProperties[key]?.secret,
          settings[key],
        )
      ) {
        newErrors[key] = error.data?.message;
      } else if (normalizedMessage.includes('url') && key.toLowerCase().includes('url')) {
        newErrors[key] = error.data?.message;
      }
    }
    if (Object.keys(newErrors).length === 0) {
      for (const key of Object.keys(schemaProperties)) {
        if (key.toLowerCase().includes('url')) {
          newErrors[key] = error.data?.message;
        }
      }
    }
  }

  return {
    newErrors,
  };
};
