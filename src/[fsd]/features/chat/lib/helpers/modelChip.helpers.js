export const resolveModelChipLabel = (modelName, models = [], selectedModel = null) => {
  if (!modelName) return '';
  const unscopedName = modelName.replace(/^\d+_/, '');
  const model =
    (selectedModel?.name === unscopedName && selectedModel) ||
    models.find(m => m.name === unscopedName) ||
    models.find(m => m.name?.includes(unscopedName));
  return model?.display_name || model?.name || modelName;
};
