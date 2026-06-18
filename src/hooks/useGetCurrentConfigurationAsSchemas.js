import { useSelector } from 'react-redux';

import { useGetAvailableConfigurationsTypeQuery } from '@/api/configurations';

const ALL_SECTIONS = [
  'credentials',
  'ai_credentials',
  'llm',
  'embedding',
  'vectorstorage',
  'image_generation',
  'storage',
  'asr',
  'tts',
];

export default function useGetCurrentConfigurationAsSchemas({ skip = false } = {}) {
  const { isFetching, isLoading } = useGetAvailableConfigurationsTypeQuery(
    { section: ALL_SECTIONS },
    { skip },
  );

  const configurationsAsSchema = useSelector(state => state.applications.configurationsAsSchema);

  return {
    configurationsAsSchema,
    isFetching,
    isLoading,
  };
}
