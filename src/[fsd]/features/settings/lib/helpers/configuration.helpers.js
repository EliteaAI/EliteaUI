import { ConfigurationConstants } from '@/[fsd]/features/settings/lib/constants';

const { ICON_TYPE_MAP } = ConfigurationConstants;

export const getIconTypeKey = (name, type, label) => {
  const iconKey = (name || type || '').toLowerCase();

  if (ICON_TYPE_MAP.VERTEX_AI.includes(iconKey.toLowerCase())) return 'VERTEX_AI';
  if (ICON_TYPE_MAP.AI_DIAL.includes(iconKey.toLowerCase())) return 'AI_DIAL';
  if (ICON_TYPE_MAP.OPEN_AI.includes(iconKey.toLowerCase())) return 'OPEN_AI';
  if (ICON_TYPE_MAP.OLLAMA.includes(iconKey.toLowerCase())) return 'OLLAMA';
  if (ICON_TYPE_MAP.AMAZON_BEDROCK.includes(iconKey.toLowerCase())) return 'AMAZON_BEDROCK';
  if (ICON_TYPE_MAP.AMAZON.includes(iconKey.toLowerCase())) return 'AMAZON';
  if (ICON_TYPE_MAP.HUGGING_FACE.includes(iconKey.toLowerCase())) return 'HUGGING_FACE';
  if (ICON_TYPE_MAP.CHROMA.includes(iconKey.toLowerCase())) return 'CHROMA';
  if (ICON_TYPE_MAP.AZURE.includes(iconKey.toLowerCase())) return 'AZURE';
  if (ICON_TYPE_MAP.PGVECTOR.includes(iconKey.toLowerCase())) return 'PGVECTOR';
  if (ICON_TYPE_MAP.CLAUDE.includes(iconKey.toLowerCase())) return 'CLAUDE';
  if (label) {
    const labelKey = label.toLowerCase();
    if (ICON_TYPE_MAP.VERTEX_AI.some(keyword => labelKey.includes(keyword))) return 'VERTEX_AI';
    if (ICON_TYPE_MAP.AI_DIAL.some(keyword => labelKey.includes(keyword))) return 'AI_DIAL';
    if (ICON_TYPE_MAP.OPEN_AI.some(keyword => labelKey.includes(keyword))) return 'OPEN_AI';
    if (ICON_TYPE_MAP.OLLAMA.some(keyword => labelKey.includes(keyword))) return 'OLLAMA';
    if (ICON_TYPE_MAP.AMAZON_BEDROCK.some(keyword => labelKey.includes(keyword))) return 'AMAZON_BEDROCK';
    if (ICON_TYPE_MAP.AMAZON.some(keyword => labelKey.includes(keyword))) return 'AMAZON';
    if (ICON_TYPE_MAP.HUGGING_FACE.some(keyword => labelKey.includes(keyword))) return 'HUGGING_FACE';
    if (ICON_TYPE_MAP.CHROMA.some(keyword => labelKey.includes(keyword))) return 'CHROMA';
    if (ICON_TYPE_MAP.AZURE.some(keyword => labelKey.includes(keyword))) return 'AZURE';
    if (ICON_TYPE_MAP.PGVECTOR.some(keyword => labelKey.includes(keyword))) return 'PGVECTOR';
    if (ICON_TYPE_MAP.CLAUDE.some(keyword => labelKey.includes(keyword))) return 'CLAUDE';
  }

  return 'DEFAULT';
};

/**
 * Generate display name from configuration object
 */
export const getConfigurationDisplayName = configuration => {
  const rawName =
    configuration?.label ||
    configuration?.data?.name ||
    configuration?.data?.model ||
    configuration?.data?.model_name ||
    configuration?.title ||
    configuration?.settings?.title ||
    configuration?.config?.name ||
    configuration?.elitea_title ||
    configuration?.name ||
    configuration?.metadata?.title ||
    configuration?.metadata?.name;

  if (rawName && String(rawName).trim().length > 0) {
    return rawName;
  }

  if (configuration.type) {
    return configuration.type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  return 'Unnamed Configuration';
};

export const getConfigurationStatus = (statusOk, isShared) => {
  const status = statusOk ? 'OK' : 'In Progress';
  const scope = isShared ? 'Shared' : 'Local';
  return `${status} • ${scope}`;
};

export const isConfigurationEditable = (configuration, projectId, canEdit) => {
  if (configuration.project_id === projectId) {
    return canEdit;
  }
  return false;
};

export const getConfigurationGroup = (name, type, label) => {
  const { CONFIGURATION_TYPE_GROUPS } = ConfigurationConstants;
  const configKey = (name || type || '').toLowerCase();
  const labelKey = (label || '').toLowerCase();

  // Priority-ordered groups: more specific hosting providers checked before generic OpenAI/Anthropic
  // so that e.g. "Azure Claude" maps to Azure, not Anthropic.
  const priorityGroups = [
    CONFIGURATION_TYPE_GROUPS.Azure,
    CONFIGURATION_TYPE_GROUPS.AmazonBedrock,
    CONFIGURATION_TYPE_GROUPS.GoogleVertexAI,
    CONFIGURATION_TYPE_GROUPS.OtherLLMProviders,
    CONFIGURATION_TYPE_GROUPS.OpenAI,
    CONFIGURATION_TYPE_GROUPS.Anthropic,
  ];

  for (const group of priorityGroups) {
    const matched =
      group.types.some(t => t.toLowerCase() === configKey || configKey.includes(t.toLowerCase())) ||
      (labelKey && group.types.some(t => labelKey.includes(t.toLowerCase())));
    if (matched) return group.label;
  }

  return CONFIGURATION_TYPE_GROUPS.OtherLLMProviders.label;
};

export const sortConfigurationsByDisplayName = (a, b) => {
  const nameA = getConfigurationDisplayName(a).toLowerCase();
  const nameB = getConfigurationDisplayName(b).toLowerCase();
  return nameA.localeCompare(nameB);
};
