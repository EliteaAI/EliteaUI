// Auto is an extra picker item, never a model name sent to a provider.
export const isAutoSelection = settings => settings?.selection?.mode === 'auto';
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
