import { useMemo } from 'react';

import { AutoRoutingConstants } from '@/[fsd]/shared/lib/constants';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { defaultModelForSurface, modelsWithAuto } from '@/[fsd]/shared/lib/utils';
import { useListModelsQuery } from '@/api/configurations';

const { MODEL_SURFACES } = AutoRoutingConstants;

export const useSkillModels = () => {
  const projectId = useSelectedProjectId();
  const { data: modelsData = { items: [] }, isLoading: isLoadingModels } = useListModelsQuery(
    { projectId, include_shared: true },
    { skip: !projectId },
  );
  const models = useMemo(
    () => modelsWithAuto(modelsData.items || [], modelsData.auto_routing, MODEL_SURFACES.agent),
    [modelsData],
  );
  const defaultModel = useMemo(() => defaultModelForSurface(modelsData, MODEL_SURFACES.agent), [modelsData]);

  return { models, defaultModel, isLoadingModels };
};
