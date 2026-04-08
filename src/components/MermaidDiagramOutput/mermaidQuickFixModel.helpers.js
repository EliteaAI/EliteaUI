export const getMermaidQuickFixModelInfo = modelsData => {
  if (!modelsData) return null;

  const lowTierName = modelsData?.low_tier_default_model_name;
  const lowTierProjectId = modelsData?.low_tier_default_model_project_id;

  if (lowTierName && lowTierProjectId) {
    return {
      modelName: String(lowTierName),
      modelProjectId: Number(lowTierProjectId),
      tooltip: `Quick Fix: ${lowTierName} (low-tier)`,
      isFallback: false,
    };
  }

  const defaultName = modelsData?.default_model_name;
  const defaultProjectId = modelsData?.default_model_project_id;

  if (defaultName && defaultProjectId) {
    return {
      modelName: String(defaultName),
      modelProjectId: Number(defaultProjectId),
      tooltip: `Quick Fix: ${defaultName} (default fallback)`,
      isFallback: true,
    };
  }

  const firstItem = Array.isArray(modelsData?.items) ? modelsData.items[0] : null;
  if (firstItem?.name && firstItem?.project_id) {
    return {
      modelName: String(firstItem.name),
      modelProjectId: Number(firstItem.project_id),
      tooltip: `Quick Fix: ${firstItem.name} (fallback)`,
      isFallback: true,
    };
  }

  return null;
};
