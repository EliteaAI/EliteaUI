import { memo, useCallback, useMemo } from 'react';

import { useFormikContext } from 'formik';

import { Box, Typography, useTheme } from '@mui/material';

import { isSkillVersionLocked } from '@/[fsd]/features/skill/lib/helpers';
import { AccordionConstants, AutoRoutingConstants, LLMSettingsConstants } from '@/[fsd]/shared/lib/constants';
import {
  autoModel,
  isAutoSelection,
  modelsWithAuto,
  resetLLMSettingsForModel,
  selectionFields,
} from '@/[fsd]/shared/lib/utils';
import { Button, Checkbox, Label } from '@/[fsd]/shared/ui';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { LLMModelSelector } from '@/[fsd]/widgets/llm-model-selector';
import { useListModelsQuery } from '@/api/configurations';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

const { DEFAULT_MAX_TOKENS } = LLMSettingsConstants;
const { MODEL_SURFACES } = AutoRoutingConstants;

const RUN_SETTINGS_FIELD = 'version_details.run_settings';
const PROJECT_DEFAULT_LABEL = 'Project default';

const findSavedModel = (models, llmSettings) => {
  if (isAutoSelection(llmSettings)) return autoModel(llmSettings.selection.profile_ref);
  const name = llmSettings?.model_name;
  if (!name) return null;
  return (
    models.find(model => model.name === name && model.project_id === llmSettings.model_project_id) ||
    models.find(model => model.name === name) || { name, project_id: llmSettings.model_project_id }
  );
};

const SkillRunSettings = memo(props => {
  const { accordionStyle, disabled = false } = props;
  const theme = useTheme();
  const { values, setFieldValue } = useFormikContext();
  const projectId = useSelectedProjectId();
  const styles = skillRunSettingsStyles();

  const runSettings = values?.version_details?.run_settings;
  const llmSettings = runSettings?.llm_settings;
  const isReadOnly = disabled || isSkillVersionLocked(values?.version_details?.status);

  const { data: modelsData = { items: [] } } = useListModelsQuery(
    { projectId, include_shared: true },
    { skip: !projectId },
  );
  const modelList = useMemo(
    () => modelsWithAuto(modelsData.items || [], modelsData.auto_routing, MODEL_SURFACES.agent),
    [modelsData],
  );
  const selectedModel = useMemo(() => findSavedModel(modelList, llmSettings), [modelList, llmSettings]);

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

  const onToggleProjectContext = useCallback(
    event => updateRunSettings({ ignore_project_context: !event.target.checked }),
    [updateRunSettings],
  );

  return (
    <BasicAccordion
      style={accordionStyle}
      accordionSX={{ background: `${theme.palette.background.default.tertiary} !important` }}
      showMode={AccordionConstants.AccordionShowMode.LeftMode}
      items={[
        {
          title: 'Run settings',
          testId: 'skill-run-settings-section',
          content: (
            <Box sx={styles.content}>
              <Typography
                variant="bodySmall"
                sx={styles.helperText}
              >
                Used when this skill runs on its own (Run, API, chat participant). Agents that attach this
                skill use their own model.
              </Typography>
              <LLMModelSelector
                variant="field"
                label="Default model"
                emptyModelLabel={PROJECT_DEFAULT_LABEL}
                fieldTestId="skill-run-settings-model"
                selectedModel={selectedModel}
                onSelectModel={onSelectModel}
                models={modelList}
                llmSettings={llmSettings || {}}
                onSetLLMSettings={onSetLLMSettings}
                onResetToDefaults={onUseProjectDefault}
                disabled={isReadOnly}
              />
              {!isReadOnly && llmSettings && (
                <Button.BaseBtn
                  variant={BUTTON_VARIANTS.secondary}
                  size="small"
                  onClick={onUseProjectDefault}
                  sx={styles.projectDefaultButton}
                  data-testid="skill-run-settings-use-project-default"
                >
                  Use project default
                </Button.BaseBtn>
              )}
              <Box sx={styles.toggleRow}>
                <Checkbox.BaseCheckbox
                  checked={!runSettings?.ignore_project_context}
                  onChange={onToggleProjectContext}
                  disabled={isReadOnly}
                  inputProps={{ 'data-testid': 'skill-run-settings-project-context' }}
                />
                <Label.InfoLabelWithTooltip
                  label="Include project context"
                  tooltip="When disabled, the project context is left out of the skill's system prompt when it runs on its own."
                  variant="bodyMedium"
                  labelSx={styles.label}
                />
              </Box>
            </Box>
          ),
        },
      ]}
    />
  );
});

SkillRunSettings.displayName = 'SkillRunSettings';

/** @type {MuiSx} */
const skillRunSettingsStyles = () => ({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    paddingBottom: '1.5rem',
  },
  helperText: ({ palette }) => ({
    color: palette.text.metrics,
  }),
  projectDefaultButton: {
    alignSelf: 'flex-start',
  },
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
  },
  label: ({ palette }) => ({
    color: palette.text.secondary,
  }),
});

export default SkillRunSettings;
