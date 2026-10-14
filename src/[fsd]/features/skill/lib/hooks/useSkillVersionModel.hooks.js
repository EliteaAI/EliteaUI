import { useCallback, useMemo } from 'react';

import { useFormikContext } from 'formik';

import { RUN_SETTINGS_FIELD } from '@/[fsd]/features/skill/lib/constants';
import {
  findSkillSavedModel,
  hasVersionModelChanged,
  isSkillVersionLocked,
} from '@/[fsd]/features/skill/lib/helpers';
import { LLMSettingsConstants } from '@/[fsd]/shared/lib/constants';
import { resetLLMSettingsForModel, selectionFields } from '@/[fsd]/shared/lib/utils';
import { PERMISSIONS } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';

import { useSkillModels } from './useSkillModels.hooks';

const { DEFAULT_MAX_TOKENS } = LLMSettingsConstants;

export const useSkillVersionModel = () => {
  const { values, initialValues, setFieldValue } = useFormikContext();
  const runSettings = values?.version_details?.run_settings;
  const llmSettings = runSettings?.llm_settings;
  const { models, isLoadingModels } = useSkillModels();
  const { checkPermission } = useCheckPermission();
  const canEditVersionModel =
    checkPermission(PERMISSIONS.skills.update) && !isSkillVersionLocked(values?.version_details?.status);
  const selectedModel = useMemo(() => findSkillSavedModel(models, llmSettings), [models, llmSettings]);
  const unsavedVersionLLMSettings =
    canEditVersionModel && hasVersionModelChanged(values, initialValues) ? llmSettings : null;

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

  return {
    runSettings,
    llmSettings,
    models,
    isLoadingModels,
    selectedModel,
    canEditVersionModel,
    unsavedVersionLLMSettings,
    updateRunSettings,
    onSelectModel,
    onSetLLMSettings,
  };
};
