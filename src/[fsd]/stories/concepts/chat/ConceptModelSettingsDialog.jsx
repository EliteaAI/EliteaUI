// Chat concept: ⚙ «Model settings» of the «who answers» list. A copy of
// src/[fsd]/widgets/llm-model-selector/ui/LLMSettingsDialog.jsx; the lines marked «concept:» are the changes.
// - concept: the title names the model, «gpt-5 · settings» (today: «Model settings»);
// - concept: under the model's settings, «How the AI works in this chat» — the five modules that left «+» › Modules:
//   Ask User, Planner, Python Sandbox, Swarm Mode, Smart Tools Selection, since technical switches belong with the
//   model's settings. Each row is named by what it does («Ask before acting»), with today's name and description
//   under it;
// - concept: the switches are part of the dialog and are saved by Apply (each changed one through
//   onInternalToolsConfigChange, as «+» › Modules saves it), Cancel drops them. In the prototype they were instant —
//   it had no dialog; here the dialog's Cancel / Apply decides.
import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Box, Divider, Typography } from '@mui/material';

import { useAvailableInternalTools } from '@/[fsd]/features/toolkits';
import { shallowEqual } from '@/[fsd]/shared/lib/utils';
import { Button, Modal } from '@/[fsd]/shared/ui';
import { VALIDATION_RULE, validateMaxTokens } from '@/[fsd]/widgets/llm-model-selector/lib';
import LLMSettings from '@/[fsd]/widgets/llm-model-selector/ui/LLMSettings';

import ConceptModuleRow from './ConceptModuleRow';
import { MODEL_SETTINGS_MODULES } from './ConceptPlusButton';

// concept: what each module does, in the prototype's words
const MODULE_NAMES = {
  ask_user: 'Ask before acting',
  planner: 'Track tasks',
  pyodide: 'Run Python',
  swarm: 'Agents work together',
  lazy_tools_mode: 'Save tokens with many toolkits',
};

const ConceptModelSettingsDialog = memo(props => {
  const {
    selectedModel,
    llmSettings = {},
    open,
    onApply,
    onCancel,
    showWebhookSecret = false,
    showStepsLimit = false,
    onResetToDefaults,
    // concept: the chat's modules
    internal_tools = [],
    onInternalToolsConfigChange,
  } = props;

  const [localSettings, setLocalSettings] = useState(llmSettings);
  const modelName = selectedModel?.display_name || selectedModel?.name;

  // concept: the five modules of the model, in the order of MODEL_SETTINGS_MODULES
  const allTools = useAvailableInternalTools({ activeToolNames: internal_tools });
  const modelTools = useMemo(
    () => MODEL_SETTINGS_MODULES.map(name => allTools.find(tool => tool.name === name)).filter(Boolean),
    [allTools],
  );
  const savedModules = useMemo(
    () => Object.fromEntries(modelTools.map(tool => [tool.name, internal_tools.includes(tool.name)])),
    [modelTools, internal_tools],
  );
  const [localModules, setLocalModules] = useState(savedModules);

  const onChangeLLMSettings = useCallback(
    field => value => {
      setLocalSettings(prev => ({
        ...prev,
        [field]: value,
      }));
    },
    [],
  );

  const hasSettingsChanges = useMemo(
    () => !shallowEqual(localSettings, llmSettings),
    [localSettings, llmSettings],
  );
  const changedModules = useMemo(
    () => modelTools.filter(tool => localModules[tool.name] !== savedModules[tool.name]),
    [modelTools, localModules, savedModules],
  );

  const handleOK = useCallback(() => {
    // concept: each changed switch is saved as «+» › Modules saves it
    changedModules.forEach(tool =>
      onInternalToolsConfigChange?.({ key: tool.name, value: localModules[tool.name] }),
    );
    if (hasSettingsChanges) onApply(localSettings);
    else onCancel();
  }, [
    changedModules,
    onInternalToolsConfigChange,
    localModules,
    hasSettingsChanges,
    onApply,
    localSettings,
    onCancel,
  ]);

  const isDisabled = useMemo(() => {
    if (!hasSettingsChanges && !changedModules.length) return true;
    const validationResult = validateMaxTokens(localSettings?.max_tokens, selectedModel);
    return validationResult !== VALIDATION_RULE.VALID;
  }, [hasSettingsChanges, changedModules.length, localSettings?.max_tokens, selectedModel]);

  useEffect(() => {
    setLocalSettings(llmSettings);
  }, [llmSettings, open]);

  useEffect(() => {
    setLocalModules(savedModules);
  }, [savedModules, open]);

  return (
    <Modal.BaseModal
      open={open}
      data-testid="model-settings-dialog"
      // concept: the model is named, the list it came from holds agents and skills too
      title={modelName ? `${modelName} · settings` : 'Model settings'}
      titleVariant="headingMedium"
      onClose={onCancel}
      content={
        <>
          <LLMSettings
            llmSettings={localSettings}
            model={selectedModel}
            onChangeLLMSettings={onChangeLLMSettings}
            showWebhookSecret={showWebhookSecret}
            showStepsLimit={showStepsLimit}
          />
          {/* concept: how the AI works in this chat */}
          {modelTools.length > 0 && (
            <Box
              sx={styles.modules}
              data-testid="model-settings-modules"
            >
              <Divider sx={styles.divider} />
              <Typography
                variant="labelSmall"
                color="text.primary"
                sx={styles.heading}
              >
                How the AI works in this chat
              </Typography>
              {modelTools.map(tool => (
                <ConceptModuleRow
                  key={tool.name}
                  component="div"
                  tool={tool}
                  title={MODULE_NAMES[tool.name] || tool.title}
                  description={`${tool.title}: ${
                    tool.unavailable
                      ? tool.unavailableTooltip
                      : [tool.infoTooltip?.text, tool.infoTooltip?.linkText, tool.infoTooltip?.suffix].join(
                          '',
                        )
                  }`}
                  checked={!!localModules[tool.name] && !tool.unavailable}
                  disabled={tool.unavailable}
                  onToggle={value => setLocalModules(prev => ({ ...prev, [tool.name]: value }))}
                  sx={styles.moduleRow}
                />
              ))}
            </Box>
          )}
        </>
      }
      actions={
        <>
          {onResetToDefaults && (
            <Button.BaseBtn
              variant="elitea"
              color="secondary"
              onClick={() => {
                onResetToDefaults();
                onCancel();
              }}
            >
              Reset to defaults
            </Button.BaseBtn>
          )}
          <Button.BaseBtn
            data-testid="model-settings-cancel-button"
            variant="elitea"
            color="secondary"
            onClick={onCancel}
          >
            Cancel
          </Button.BaseBtn>
          <Button.BaseBtn
            data-testid="model-settings-apply-button"
            variant="elitea"
            onClick={handleOK}
            disabled={isDisabled}
          >
            Apply
          </Button.BaseBtn>
        </>
      }
    />
  );
});

ConceptModelSettingsDialog.displayName = 'ConceptModelSettingsDialog';

/** @type {MuiSx} */
const styles = {
  modules: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: '1rem',
  },
  // as wide as the settings above it
  divider: {
    marginBottom: '1rem',
    marginLeft: '1.5rem',
    marginRight: '1rem',
  },
  // lined up with the headings of LLMSettings above (REASONING, STEPS LIMIT)
  heading: {
    textTransform: 'uppercase',
    fontSize: '.75rem',
    paddingX: '1.5rem',
    paddingBottom: '.25rem',
  },
  moduleRow: {
    paddingLeft: '1.5rem',
    paddingRight: '1rem',
  },
};

export default ConceptModelSettingsDialog;
