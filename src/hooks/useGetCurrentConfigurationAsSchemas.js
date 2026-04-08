import { useEffect } from 'react';

import { useSelector } from 'react-redux';

import { useLazyGetAvailableConfigurationsTypeQuery } from '@/api/configurations';

export default function useGetCurrentConfigurationAsSchemas({ skip = false } = {}) {
  const [getConfigurationsAsSchema, { isFetching, isLoading }] = useLazyGetAvailableConfigurationsTypeQuery();
  // const {data} = useGetConfigurationsListQuery({projectId});
  // console.log("data: ", data)

  const configurationsAsSchema = useSelector(state => state.applications.configurationsAsSchema);

  useEffect(() => {
    // Fetch schemas from multiple sections to support all credential types
    // including AI credentials (Azure OpenAI, etc.) which are in ai_credentials section
    if (skip) {
      return;
    }
    getConfigurationsAsSchema({ section: 'credentials' });
    getConfigurationsAsSchema({ section: 'ai_credentials' });
    getConfigurationsAsSchema({ section: 'llm' });
    getConfigurationsAsSchema({ section: 'embedding' });
    getConfigurationsAsSchema({ section: 'vectorstorage' });
    getConfigurationsAsSchema({ section: 'image_generation' });
    getConfigurationsAsSchema({ section: 'storage' });
  }, [getConfigurationsAsSchema, skip]);

  return {
    configurationsAsSchema,
    isFetching,
    isLoading,
  };
}
