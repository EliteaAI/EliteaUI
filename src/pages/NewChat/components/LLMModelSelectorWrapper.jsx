import { memo, useCallback, useEffect, useMemo } from 'react';

import { useFormikContext } from 'formik';

import { Box } from '@mui/material';

import { DEFAULT_MAX_TOKENS, DEFAULT_TEMPERATURE } from '@/[fsd]/shared/lib/constants/llmSettings.constants';
import LLMModelSelector from '@/[fsd]/widgets/LLMModelSelector/ui/LLMModelSelector';
import { useListModelsQuery } from '@/api/configurations';
import { PROMPT_PAYLOAD_KEY } from '@/common/constants';

/**
 * Shared wrapper component for LLM model selection in editor contexts
 * Works with Formik forms that have version_details.llm_settings structure
 */
const LLMModelSelectorWrapper = ({
  projectId,
  onLLMSettingsChange,
  disabled,
  modelTooltip,
  settingsTooltip,
}) => {
  const {
    values: { version_details = {} },
    setFieldValue,
  } = useFormikContext();
  const isDisabled = disabled;

  // Compute modelName from Formik values (which are always up-to-date with backend)
  const modelName = version_details?.llm_settings?.model_name;

  const { data: modelsData = { items: [], total: 0 } } = useListModelsQuery(
    { projectId, include_shared: true },
    { skip: !projectId },
  );

  const modelList = useMemo(() => modelsData.items || [], [modelsData.items]);

  const defaultModel = useMemo(() => {
    return modelsData.items.find(model => model.default) || modelsData.items[0] || null;
  }, [modelsData.items]);

  useEffect(() => {
    if (version_details && !version_details?.llm_settings?.model_name && defaultModel) {
      setFieldValue('version_details.llm_settings', {
        ...version_details?.llm_settings,
        model_name: defaultModel?.name,
        model_project_id: defaultModel?.project_id,
      });
    }
  }, [
    defaultModel,
    setFieldValue,
    version_details,
    version_details?.llm_settings,
    version_details?.llm_settings?.model_name,
  ]);

  const selectedModel = useMemo(
    () => modelList.find(m => m.id === modelName || m.name === modelName) || null,
    [modelList, modelName],
  );

  const handleSelectModel = useCallback(
    model => {
      const newSettings = {
        ...version_details?.llm_settings,
        model_name: model?.name,
        model_project_id: model?.project_id,
        [PROMPT_PAYLOAD_KEY.maxTokens]: DEFAULT_MAX_TOKENS,
        temperature: DEFAULT_TEMPERATURE,
        // Only set reasoning_effort if the model supports it
        ...(model?.supports_reasoning && { reasoning_effort: 'medium' }),
      };
      setFieldValue('version_details.llm_settings', newSettings);
      onLLMSettingsChange?.(pev => ({ ...pev, ...newSettings }));
    },
    [onLLMSettingsChange, setFieldValue, version_details?.llm_settings],
  );

  const handleSetLLMSettings = useCallback(
    settings => {
      onLLMSettingsChange?.(prev => ({ ...prev, ...settings }));
      setFieldValue('version_details.llm_settings', {
        ...version_details?.llm_settings,
        ...settings,
      });
    },
    [onLLMSettingsChange, setFieldValue, version_details?.llm_settings],
  );

  if (!modelList.length) return <Box sx={{ p: 2 }}>Loading models...</Box>;

  return (
    <Box sx={{ p: 2, pb: 3 }}>
      <LLMModelSelector
        selectedModel={selectedModel}
        onSelectModel={handleSelectModel}
        models={modelList}
        llmSettings={version_details?.llm_settings}
        onSetLLMSettings={handleSetLLMSettings}
        disabled={isDisabled}
        modelTooltip={modelTooltip}
        settingsTooltip={settingsTooltip}
      />
    </Box>
  );
};

export default memo(LLMModelSelectorWrapper);
