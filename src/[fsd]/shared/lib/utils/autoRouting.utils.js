// Auto is an extra picker item, never a model name sent to a provider.
export const isAutoSelection = settings => settings?.selection?.mode === 'auto';
export const AUTO_DEFAULT_VALUE = '__elitea_auto_default__';
export const autoModel = profile => ({
  id: '__elitea_auto__',
  name: '__elitea_auto__',
  display_name: 'Auto',
  max_output_tokens: 32000,
  selection: { mode: 'auto', profile_ref: profile, scope_mode: 'task_episode', reasoning: { mode: 'auto' } },
});
export const modelsWithAuto = (models, availability, surface) =>
  availability?.enabled === true && ['chat', 'agent'].includes(surface)
    ? [autoModel(availability.profile_ref), ...models]
    : models;
// Only eligible creation surfaces opt into the project default intent. The
// catalog's existing default flag remains concrete for Pipelines/internal tools.
export const defaultModelForSurface = (data, surface) =>
  data?.auto_routing?.enabled === true &&
  data?.default_selection?.mode === 'auto' &&
  ['chat', 'agent'].includes(surface)
    ? autoModel(data.default_selection.profile_ref)
    : data?.items?.find(model => model.default) || data?.items?.[0] || null;
export const defaultModelRequest = (section, value) => {
  if (section === 'llm' && value === AUTO_DEFAULT_VALUE) return { section, mode: 'auto' };
  const [name, projectId] = value.split('<<>>');
  return { section, name, target_project_id: +projectId };
};
export const selectionFields = model =>
  model?.selection?.mode === 'auto'
    ? {
        selection: model.selection,
        model_name: null,
        model_project_id: null,
        temperature: null,
        reasoning_effort: null,
      }
    : { selection: null, model_name: model?.name, model_project_id: model?.project_id };
