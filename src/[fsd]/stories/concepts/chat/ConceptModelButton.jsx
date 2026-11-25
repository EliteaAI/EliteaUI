// Chat concept: the model's button under the field when the model answers. A copy of the default variant of
// src/[fsd]/widgets/llm-model-selector/ui/LLMModelSelector.jsx; the lines marked «concept:» are the changes:
// - concept: one button with no fill, the team's tertiary button (fill on hover only): the model's icon, its name cut
//   with «…», a chevron;
// - the list of models is the team's LLMModelsMenu as is;
// - ⚙ «Model Settings» right after it opens the team's LLMSettingsDialog with the props LLMModelSelector passes it
//   (onResetToDefaults too); the ⚙ is a tertiary icon button like the model's (today: half of a filled button group);
// - concept: tooltip «Switch to model» (today: «Select LLM Model»).
import { memo, useCallback, useMemo, useRef, useState } from 'react';

import { Box, Tooltip, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { normalizeLlmSettings } from '@/[fsd]/widgets/llm-model-selector/lib/helpers';
import LLMModelsMenu from '@/[fsd]/widgets/llm-model-selector/ui/LLMModelsMenu';
import LLMSettingsDialog from '@/[fsd]/widgets/llm-model-selector/ui/LLMSettingsDialog';
import ShareIcon from '@/assets/share-icon.svg?react';
import ArrowDownIcon from '@/components/Icons/ArrowDownIcon';
import BriefcaseIcon from '@/components/Icons/BriefcaseIcon.jsx';
import SettingIcon from '@/components/Icons/SettingIcon';

const ConceptModelButton = memo(props => {
  const {
    selectedModel,
    onSelectModel,
    models = [],
    disabled = false,
    dataTourTargetId,
    emptyModelLabel = 'None',
    llmSettings,
    onSetLLMSettings,
    showWebhookSecret = false,
    showStepsLimit = false,
    onResetToDefaults,
  } = props;

  const anchorRef = useRef(null);
  const [anchorEl, setAnchorEl] = useState(null);
  // ⚙ «Model Settings», as LLMModelSelector does it
  const [showSettings, setShowSettings] = useState(false);
  const normalizedLlmSettings = useMemo(
    () => normalizeLlmSettings(llmSettings || {}, selectedModel, { showStepsLimit }),
    [llmSettings, selectedModel, showStepsLimit],
  );
  const handleApplySettings = useCallback(
    newSettings => {
      onSetLLMSettings?.(newSettings);
      setShowSettings(false);
    },
    [onSetLLMSettings],
  );
  const styles = conceptModelButtonStyles();

  const name = selectedModel?.display_name || selectedModel?.name || emptyModelLabel;
  const ModelIcon = selectedModel?.shared ? ShareIcon : BriefcaseIcon;

  return (
    <>
      <Tooltip
        placement="top"
        title="Switch to model"
      >
        <Box
          component="span"
          sx={styles.wrapper}
        >
          <Button.BaseBtn
            ref={anchorRef}
            id="model-selector-button"
            variant={Button.BUTTON_VARIANTS.tertiary}
            disabled={disabled}
            onClick={() => setAnchorEl(anchorRef.current)}
            aria-haspopup="listbox"
            aria-expanded={Boolean(anchorEl)}
            aria-label={`Answers: ${name}`}
            data-testid="model-selector-name"
            data-tour={dataTourTargetId || undefined}
            startIcon={selectedModel ? <ModelIcon sx={styles.icon} /> : undefined}
            endIcon={<ArrowDownIcon sx={styles.chevron} />}
            sx={styles.button}
          >
            <Typography
              variant="inherit"
              noWrap
              sx={styles.name}
            >
              {name}
            </Typography>
          </Button.BaseBtn>
        </Box>
      </Tooltip>

      {onSetLLMSettings && (
        <Tooltip
          placement="top"
          title="Model Settings"
        >
          <Box component="span">
            <Button.BaseBtn
              variant={Button.BUTTON_VARIANTS.tertiary}
              disabled={disabled}
              onClick={() => setShowSettings(true)}
              aria-expanded={showSettings ? 'true' : undefined}
              aria-label="model settings menu"
              aria-haspopup="menu"
              data-testid="model-settings-button"
              sx={styles.settingsButton}
            >
              <SettingIcon sx={styles.icon} />
            </Button.BaseBtn>
          </Box>
        </Tooltip>
      )}

      <LLMModelsMenu
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        models={models}
        selectedModel={selectedModel}
        onSelectModel={onSelectModel}
      />

      {onSetLLMSettings && (
        <LLMSettingsDialog
          open={showSettings}
          onApply={handleApplySettings}
          onCancel={() => setShowSettings(false)}
          selectedModel={selectedModel}
          llmSettings={normalizedLlmSettings}
          showWebhookSecret={showWebhookSecret}
          showStepsLimit={showStepsLimit}
          onResetToDefaults={onResetToDefaults}
        />
      )}
    </>
  );
});

ConceptModelButton.displayName = 'ConceptModelButton';

/** @type {MuiSx} */
const conceptModelButtonStyles = () => ({
  wrapper: {
    display: 'inline-flex',
    minWidth: 0,
    maxWidth: '100%',
  },
  button: {
    minWidth: 0,
    maxWidth: '100%',
    gap: '.5rem',
    // concept: the button's right edge lines up with the field's (tertiary pads 1rem)
    padding: '.375rem .5rem',
    '& .MuiButton-startIcon, & .MuiButton-endIcon': { margin: 0 },
    // concept: while its list is open the button keeps the hover fill and the chevron turns up
    '&[aria-expanded="true"]': {
      backgroundColor: ({ palette }) => palette.components.button.background.tertiary.hover,
      '& .MuiButton-endIcon': { transform: 'rotate(180deg)' },
    },
  },
  name: {
    minWidth: 0,
  },
  settingsButton: {
    minWidth: 0,
    padding: '.375rem',
    '&[aria-expanded="true"]': {
      backgroundColor: ({ palette }) => palette.components.button.background.tertiary.hover,
    },
  },
  icon: {
    width: '1rem',
    height: '1rem',
    fontSize: '1rem',
  },
  chevron: {
    fontSize: '1rem',
    color: 'icon.default',
  },
});

export default ConceptModelButton;
