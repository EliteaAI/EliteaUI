import { useCallback, useMemo } from 'react';

import { useFormikContext } from 'formik';

import { RUN_SETTINGS_FIELD } from '@/[fsd]/features/skill/lib/constants';
import { findSkillSavedModel } from '@/[fsd]/features/skill/lib/helpers';
import { AutoRoutingConstants, LLMSettingsConstants } from '@/[fsd]/shared/lib/constants';
import { modelsWithAuto, resetLLMSettingsForModel, selectionFields } from '@/[fsd]/shared/lib/utils';
import { useListModelsQuery } from '@/api/configurations';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

const { DEFAULT_MAX_TOKENS } = LLMSettingsConstants;
const { MODEL_SURFACES } = AutoRoutingConstants;

export const useSkillVersionModel = () => {
  const { values, setFieldValue } = useFormikContext();
  const projectId = useSelectedProjectId();
  const runSettings = values?.version_details?.run_settings;
  const llmSettings = runSettings?.llm_settings;

  const { data: modelsData = { items: [] } } = useListModelsQuery(
    { projectId, include_shared: true },
    { skip: !projectId },
  );
  const models = useMemo(
    () => modelsWithAuto(modelsData.items || [], modelsData.auto_routing, MODEL_SURFACES.agent),
    [modelsData],
  );
  const selectedModel = useMemo(() => findSkillSavedModel(models, llmSettings), [models, llmSettings]);

  const updateRunSettings = useCallback(
    patch => setFieldValue(RUN_SETTINGS_FIELD, { ...runSettings, ...patch }),
    [runSettings, setFieldValue],
  );

  const onSelectModel = useCallback(
    model =>
      updateRunSettings({
        llm_settings: {
          max_tokens: llmSettings?.max_tokens ?? DEFAULT_MAX_TOKENS,
          ...resetLLMSettingsForModel(model),
          ...selectionFields(model),
        },
      }),
    [llmSettings?.max_tokens, updateRunSettings],
  );

  const onSetLLMSettings = useCallback(
    settings => updateRunSettings({ llm_settings: { ...llmSettings, ...settings } }),
    [llmSettings, updateRunSettings],
  );

  const onUseProjectDefault = useCallback(
    () => updateRunSettings({ llm_settings: null }),
    [updateRunSettings],
  );

  return {
    runSettings,
    llmSettings,
    models,
    selectedModel,
    updateRunSettings,
    onSelectModel,
    onSetLLMSettings,
    onUseProjectDefault,
  };
};
