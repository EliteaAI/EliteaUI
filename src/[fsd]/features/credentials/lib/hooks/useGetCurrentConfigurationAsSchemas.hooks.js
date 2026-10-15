import { useSelector } from 'react-redux';

import { useSelectedProject } from '@/[fsd]/shared/lib/hooks';
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

export const useGetCurrentConfigurationAsSchemas = ({ skip = false } = {}) => {
  // Scoped because this feeds the create form's schema lookup, which is reachable by
  // direct URL — gating only the type picker would leave that route open
  const projectId = useSelectedProject()?.id;

  const { isFetching, isLoading } = useGetAvailableConfigurationsTypeQuery(
    { section: ALL_SECTIONS, project_id: projectId },
    { skip },
  );

  const configurationsAsSchema = useSelector(state => state.applications.configurationsAsSchema);

  return {
    configurationsAsSchema,
    isFetching,
    isLoading,
  };
};
