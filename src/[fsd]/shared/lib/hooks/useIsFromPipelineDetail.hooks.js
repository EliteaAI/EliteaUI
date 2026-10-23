import { useMatch } from 'react-router-dom';

import RouteDefinitions from '@/routes';

export const useIsFromPipelineDetail = () => {
  const isFromCreatePipeline = useMatch({ path: RouteDefinitions.CreatePipeline });
  const isFromViewPipeline = useMatch({ path: RouteDefinitions.PipelineDetail });
  const isFromViewPipelineVersion = useMatch({ path: `${RouteDefinitions.PipelineDetail}/:version` });

  return !!isFromCreatePipeline || !!isFromViewPipeline || !!isFromViewPipelineVersion;
};
