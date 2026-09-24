import { memo, useCallback, useEffect, useMemo } from 'react';

import { useFormikContext } from 'formik';

import { Box } from '@mui/material';

import { AutoRoutingConstants, LLMSettingsConstants } from '@/[fsd]/shared/lib/constants';
import {
  autoModel,
  isAutoSelection,
  modelsWithAuto,
  resetLLMSettingsForModel,
  resolveModelSurface,
  selectionFields,
} from '@/[fsd]/shared/lib/utils';
import { LLMModelSelector } from '@/[fsd]/widgets/llm-model-selector';
import { useListModelsQuery } from '@/api/configurations';
import { PROMPT_PAYLOAD_KEY } from '@/common/constants';

const { DEFAULT_MAX_TOKENS } = LLMSettingsConstants;

const { MODEL_SURFACES } = AutoRoutingConstants;

/**
 * Shared wrapper component for LLM model selection in editor contexts
 * Works with Formik forms that have version_details.llm_settings structure
 */
const LLMModelSelectorWrapper = memo(props => {
  const {
    projectId,
    onLLMSettingsChange,
    disabled,
    modelTooltip,
    settingsTooltip,
    // When provided (for public agents), model changes save to entity_settings instead of agent version
    onPublicLlmOverride,
  } = props;

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

  const modelList = useMemo(
    () =>
      modelsWithAuto(
        modelsData.items || [],
        modelsData.auto_routing,
        resolveModelSurface(version_details?.agent_type, undefined, MODEL_SURFACES.agent),
      ),
    [modelsData, version_details?.agent_type],
  );

  // Creation applies the project default before opening this editor. Repair
  // missing legacy settings with a concrete model, never a new Auto opt-in.
  // Existing saved concrete/Auto selections are left unchanged.
  const defaultModel = useMemo(() => {
    return modelsData.items.find(model => model.default) || modelsData.items[0] || null;
  }, [modelsData.items]);

  useEffect(() => {
    if (
      version_details &&
      !isAutoSelection(version_details.llm_settings) &&
      !version_details?.llm_settings?.model_name &&
      defaultModel
    ) {
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
    () =>
      isAutoSelection(version_details.llm_settings)
        ? autoModel(version_details.llm_settings.selection.profile_ref)
        : modelList.find(m => m.id === modelName || m.name === modelName) || null,
    [modelList, modelName, version_details.llm_settings],
  );

  const handleSelectModel = useCallback(
    model => {
      const newSettings = {
        ...version_details?.llm_settings,
        model_name: model?.name,
        model_project_id: model?.project_id,
        [PROMPT_PAYLOAD_KEY.maxTokens]: DEFAULT_MAX_TOKENS,
        // Explicitly resets both temperature and reasoning_effort for the new model's family —
        // never leaves a stale value from the previously selected model (issue #5821).
        ...resetLLMSettingsForModel(model),
        ...selectionFields(model),
      };
      setFieldValue('version_details.llm_settings', newSettings);
      onLLMSettingsChange?.(pev => ({ ...pev, ...newSettings }));
      onPublicLlmOverride?.(newSettings);
    },
    [onLLMSettingsChange, onPublicLlmOverride, setFieldValue, version_details?.llm_settings],
  );

  const handleSetLLMSettings = useCallback(
    settings => {
      onLLMSettingsChange?.(prev => ({ ...prev, ...settings }));
      const fullSettings = { ...version_details?.llm_settings, ...settings };
      setFieldValue('version_details.llm_settings', fullSettings);
      onPublicLlmOverride?.(fullSettings);
    },
    [onLLMSettingsChange, onPublicLlmOverride, setFieldValue, version_details?.llm_settings],
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
        onResetToDefaults={onPublicLlmOverride ? () => onPublicLlmOverride(null) : undefined}
      />
    </Box>
  );
});

LLMModelSelectorWrapper.displayName = 'LLMModelSelectorWrapper';

export default LLMModelSelectorWrapper;
