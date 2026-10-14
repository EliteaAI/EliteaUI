import { memo, useCallback } from 'react';

import { useFormikContext } from 'formik';

import { Box, Typography, useTheme } from '@mui/material';

import { PROJECT_DEFAULT_MODEL_LABEL } from '@/[fsd]/features/skill/lib/constants';
import { isSkillVersionLocked } from '@/[fsd]/features/skill/lib/helpers';
import { useSkillVersionModel } from '@/[fsd]/features/skill/lib/hooks';
import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import { Button, Checkbox, Label } from '@/[fsd]/shared/ui';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { LLMModelSelector } from '@/[fsd]/widgets/llm-model-selector';

const SkillRunSettings = memo(props => {
  const { accordionStyle, disabled = false, showModel = true } = props;
  const theme = useTheme();
  const { values } = useFormikContext();
  const styles = skillRunSettingsStyles();
  const {
    runSettings,
    llmSettings,
    models,
    selectedModel,
    updateRunSettings,
    onSelectModel,
    onSetLLMSettings,
    onUseProjectDefault,
  } = useSkillVersionModel();
  const isReadOnly = disabled || isSkillVersionLocked(values?.version_details?.status);

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
              {showModel && (
                <>
                  <LLMModelSelector
                    variant="field"
                    label="Default model"
                    emptyModelLabel={PROJECT_DEFAULT_MODEL_LABEL}
                    fieldTestId="skill-run-settings-model"
                    selectedModel={selectedModel}
                    onSelectModel={onSelectModel}
                    models={models}
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
                </>
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
