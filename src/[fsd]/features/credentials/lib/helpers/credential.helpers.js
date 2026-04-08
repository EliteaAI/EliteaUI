import { CredentialIconHelpers, CredentialNameHelpers } from '@/[fsd]/features/credentials/lib/helpers';

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
