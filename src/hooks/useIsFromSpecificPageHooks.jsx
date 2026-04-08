import { useMemo } from 'react';

import { useLocation, useMatch, useSearchParams } from 'react-router-dom';

import { SearchParams } from '@/common/constants.js';
import RouteDefinitions from '@/routes';

export const useIsFromPipelineDetail = () => {
  const isFromCreatePipeline = useMatch({ path: RouteDefinitions.CreatePipeline });
  const isFromViewPipeline = useMatch({ path: RouteDefinitions.PipelineDetail });
  const isFromViewPipelineVersion = useMatch({ path: `${RouteDefinitions.PipelineDetail}/:version` });

  return !!isFromCreatePipeline || !!isFromViewPipeline || !!isFromViewPipelineVersion;
};

export const useIsCreatingEntities = () => {
  const matchCreateAgent = useMatch({ path: RouteDefinitions.CreateApplication });
  const matchCreatePipeline = useMatch({ path: RouteDefinitions.CreatePipeline });

  return !!matchCreateAgent || !!matchCreatePipeline;
};

export const useIsCreatingConversation = () => {
  const [searchParams] = useSearchParams();
  const isCreating = useMemo(() => searchParams.get(SearchParams.CreateConversation), [searchParams]);
  return isCreating;
};

export const useIsFrom = path => {
  const { pathname } = useLocation();
  const isFrom = useMemo(() => pathname.startsWith(path), [path, pathname]);
  return isFrom;
};
