import { useMemo } from 'react';

import { useGetCurrentToolkitSchemas, useParseSections } from '@/[fsd]/features/toolkits/lib/hooks';
import useGetCurrentConfigurationAsSchemas from '@/hooks/useGetCurrentConfigurationAsSchemas';

export default function useToolkitConfigurationProperties({ toolType }) {
  const { toolkitSchemas } = useGetCurrentToolkitSchemas();
  const { configurationsAsSchema } = useGetCurrentConfigurationAsSchemas();

  const filteredConfigurationsAsSchema = useMemo(() => {
    return configurationsAsSchema.find(item => item.type === toolType);
  }, [configurationsAsSchema, toolType]);

  const toolSchema = useMemo(() => {
    return toolkitSchemas?.[toolType];
  }, [toolkitSchemas, toolType]);
  const { sections, sectionProps } = useParseSections(
    filteredConfigurationsAsSchema?.config_schema?.properties?.data?.metadata?.sections
      ? filteredConfigurationsAsSchema?.config_schema?.properties?.data
      : toolSchema,
  );
  const configurationRequiredProps = useMemo(() => {
    const configurationProps = Object.keys(filteredConfigurationsAsSchema?.config_schema?.properties || {});
    const basicProps = configurationProps.filter(
      prop => !sectionProps.find(sectionProp => sectionProp === prop),
    );
    return (
      basicProps.length === configurationProps.length ? [...basicProps] : [...basicProps, 'auth']
    ).filter(
      prop =>
        prop !== 'type' && prop !== 'shared' && prop !== 'alita_title' && prop !== 'label' && prop !== 'data',
    );
  }, [sectionProps, filteredConfigurationsAsSchema]);

  return {
    sections,
    sectionProps,
    filteredConfigurationsAsSchema,
    configurationRequiredProps,
    toolSchema,
  };
}
