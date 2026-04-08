import { useMemo } from 'react';

import { useGetToolkitNameFromSchema } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';

export const useToolkitNameProp = type => {
  const { getToolkitNamePropFromSchema, isNameRequired, getRequiredProperties, schemaOfTools } =
    useGetToolkitNameFromSchema();

  const toolkitNameProp = useMemo(
    () => getToolkitNamePropFromSchema(type),
    [getToolkitNamePropFromSchema, type],
  );
  const requiredName = useMemo(() => isNameRequired(type), [isNameRequired, type]);
  const requiredDescription = useMemo(() => {
    const requiredProperties = getRequiredProperties(type);
    return requiredProperties?.includes('description');
  }, [getRequiredProperties, type]);

  return {
    toolkitNameProp,
    nameIsRequired: requiredName,
    descriptionIsRequired: requiredDescription,
    schemaOfTools,
  };
};
