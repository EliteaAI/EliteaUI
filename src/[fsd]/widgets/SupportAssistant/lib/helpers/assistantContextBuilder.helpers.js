import { browser } from 'globals';

export const filterDefined = obj =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null));

export const cleanMeta = meta => {
  if (!meta) return undefined;

  const cleaned = filterDefined(meta);

  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
};

export const getBrowserInfo = () => browser.navigation?.userAgent || navigator.userAgent;

export const buildApplicationContext = (baseContext, currentApplication, matchParams, entityType) => {
  const { agentId, tab } = matchParams;

  if (!agentId) return baseContext;

  if (!currentApplication) return baseContext;

  const llmSettings = currentApplication?.version_details?.llm_settings;

  return filterDefined({
    ...baseContext,
    current_entity_type: entityType,
    current_entity_id: parseInt(currentApplication.id, 10),
    current_entity_name: currentApplication?.name,
    selected_model: llmSettings?.model_name,
    selected_provider: llmSettings?.integration_name,
    meta: cleanMeta({
      tab,
      versionId: currentApplication?.version_details?.id,
      browser: getBrowserInfo(),
    }),
  });
};

export const buildSimpleEntityContext = (baseContext, matchParams, entityType, idKey) => {
  const id = matchParams[idKey];

  if (!id) return baseContext;

  return filterDefined({
    ...baseContext,
    current_entity_type: entityType,
    current_entity_id: parseInt(id, 10),
    meta: cleanMeta({ tab: matchParams.tab, browser: getBrowserInfo() }),
  });
};
