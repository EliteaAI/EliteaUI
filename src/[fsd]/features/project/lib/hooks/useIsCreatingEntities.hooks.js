import { useMatch } from 'react-router-dom';

import RouteDefinitions from '@/routes';

export const useIsCreatingEntities = () => {
  const matchCreateAgent = useMatch({ path: RouteDefinitions.CreateApplication });
  const matchCreatePipeline = useMatch({ path: RouteDefinitions.CreatePipeline });

  return !!matchCreateAgent || !!matchCreatePipeline;
};
