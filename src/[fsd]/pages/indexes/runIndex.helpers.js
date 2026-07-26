export const shouldBlockRunIndexPanel = ({
  hasEffectiveIndex,
  hasToolkit,
  isToolkitFetching,
  indexesLoading,
  indexesFetching,
  hasIndexesData,
}) => {
  if (hasEffectiveIndex) return !hasToolkit;

  return isToolkitFetching || indexesLoading || indexesFetching || !hasIndexesData || !hasToolkit;
};
