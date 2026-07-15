import * as CredentialIconHelpers from './credentialIcon.helpers';
import * as CredentialNameHelpers from './credentialName.helpers';

export const normalizeCredentialSection = section => {
  switch (section) {
    case 'embedding_model':
      return 'embedding';
    case 'credentials':
      return 'ai_credentials';
    case 'llm_model':
      return 'llm';
    case 'asr_model':
      return 'asr';
    case 'tts_model':
      return 'tts';
    case 'pgvector':
    case 'postgres':
    case 'postgresql':
      return 'vectorstorage';
    case 'image_generation_model':
      return 'image_generation';
    default:
      if (
        section &&
        [
          'open_ai',
          'openai',
          'claude',
          'anthropic',
          'azure_open_ai',
          'azure_openai',
          'vertex_ai',
          'vertexai',
          'amazon_bedrock',
          'hugging_face',
          'huggingface',
          'ollama',
          'gpt',
          'ai_dial',
          'model-router',
        ].includes(section)
      ) {
        return 'llm';
      }
      return section;
  }
};

export const generateCredentialTagList = credentials => {
  if (!credentials || !Array.isArray(credentials)) return [];

  const typeCounts = credentials.reduce((acc, credential) => {
    const type = credential.type;
    if (!acc[type]) {
      acc[type] = 0;
    }
    acc[type]++;
    return acc;
  }, {});

  const tagList = Object.keys(typeCounts)
    .map((type, index) => {
      return {
        id: type + (index + 1),
        name: CredentialNameHelpers.extraCredentialName(type),
        data: {
          type, // Keep the raw type for filtering
        },
        credential_count: typeCounts[type],
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically by name

  return tagList;
};

export const enhanceCredentialData = (credentials, theme, toolkitSchemas, configurationsAsSchema) => {
  if (!credentials || !Array.isArray(credentials)) return [];

  const enhancedCredentials = credentials.map(credential => {
    const credentialType = credential.type;
    const credentialName =
      credential.label ||
      credential.elitea_title ||
      credential.data?.title ||
      CredentialNameHelpers.extraCredentialName(credentialType);
    const iconData = CredentialIconHelpers.getCredentialIconData(
      credentialType,
      theme,
      toolkitSchemas,
      configurationsAsSchema,
    );

    return {
      ...credential,
      name: credentialName, // This is what shows as the card title
      description: CredentialNameHelpers.extraCredentialName(credentialType), // This shows as the card subtitle
      type: credentialType,
      actions: '',
      id: credential.uid || credential.id,
      originalId: credential.id,

      // Icon metadata for Card component - following Toolkits pattern
      icon_meta: iconData.icon_meta,

      // Tags for filtering (same as Toolkits pattern)
      tags: iconData.tags,

      // Additional credential-specific data
      enhanced_type: credentialType,
      credential_url: credential.data?.base_url || credential.data?.url || '',
      project_scope: credential.project_id ? 'Local' : 'Inherited',
    };
  });

  // Sort order is determined by the backend via sort_by/sort_order query params — no local re-sort needed.
  return enhancedCredentials;
};
