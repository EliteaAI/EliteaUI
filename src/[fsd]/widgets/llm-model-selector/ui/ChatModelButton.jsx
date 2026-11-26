import { memo } from 'react';

import { Box, Tooltip, Typography, useTheme } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import ShareIcon from '@/assets/share-icon.svg?react';
import ArrowDownIcon from '@/components/Icons/ArrowDownIcon';
import BriefcaseIcon from '@/components/Icons/BriefcaseIcon.jsx';
import SettingIcon from '@/components/Icons/SettingIcon';

import { useLlmModelSelector } from '../lib/hooks';
import LLMModelsMenu from './LLMModelsMenu';
import LLMSettingsDialog from './LLMSettingsDialog';

/**
 * The model under the chat input: a borderless button with the model's icon, name and a chevron that opens the model
 * list, then ⚙ «Model settings». The list and the dialog are the ones of LLMModelSelector.
 */
const ChatModelButton = memo(props => {
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

  const theme = useTheme();

  const {
    anchorRef,
    anchorEl,
    showLLMSettings,
    normalizedLlmSettings,
    handleModelMenuClick,
    handleClose,
    handleSettingsClick,
    handleApplySettings,
    handleCancelSettings,
  } = useLlmModelSelector({ llmSettings, selectedModel, showStepsLimit, onSetLLMSettings });

  const styles = chatModelButtonStyles();

  const name = selectedModel?.display_name || selectedModel?.name || emptyModelLabel;
  const ModelIcon = selectedModel?.shared ? ShareIcon : BriefcaseIcon;

  return (
    <>
      <Box
        component="span"
        data-tour={dataTourTargetId || undefined}
        data-testid="model-selector-button"
        sx={styles.group}
      >
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
              onClick={handleModelMenuClick}
              aria-haspopup="listbox"
              aria-expanded={Boolean(anchorEl)}
              data-testid="model-selector-name"
              startIcon={
                selectedModel ? (
                  <Box
                    component={ModelIcon}
                    sx={styles.icon}
                  />
                ) : undefined
              }
              endIcon={
                <Box
                  component={ArrowDownIcon}
                  sx={styles.chevron}
                />
              }
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

        <Tooltip
          placement="top"
          title="Model settings"
        >
          <Box component="span">
            <Button.BaseBtn
              variant={Button.BUTTON_VARIANTS.tertiary}
              disabled={!onSetLLMSettings}
              onClick={handleSettingsClick}
              aria-expanded={showLLMSettings ? 'true' : undefined}
              aria-label="model settings menu"
              aria-haspopup="menu"
              data-testid="model-settings-button"
              sx={styles.settingsButton}
              startIcon={
                <SettingIcon
                  sx={styles.icon}
                  fill={onSetLLMSettings ? undefined : theme.palette.icon.disabled}
                />
              }
            />
          </Box>
        </Tooltip>
      </Box>

      <LLMModelsMenu
        anchorEl={anchorEl}
        onClose={handleClose}
        models={models}
        selectedModel={selectedModel}
        onSelectModel={onSelectModel}
      />

      {onSetLLMSettings && (
        <LLMSettingsDialog
          open={showLLMSettings}
          onApply={handleApplySettings}
          onCancel={handleCancelSettings}
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

ChatModelButton.displayName = 'ChatModelButton';

/** @type {MuiSx} */
const chatModelButtonStyles = () => ({
  group: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '.5rem',
    minWidth: 0,
    maxWidth: '100%',
  },
  wrapper: {
    display: 'inline-flex',
    minWidth: 0,
    maxWidth: '100%',
  },
  button: ({ palette }) => ({
    minWidth: 0,
    maxWidth: '100%',
    gap: '.5rem',
    // The button's right edge lines up with the field's (tertiary pads 1rem)
    padding: '.375rem .5rem',
    '& .MuiButton-startIcon, & .MuiButton-endIcon': { margin: 0 },
    // While its list is open the button keeps the hover fill and the chevron turns up
    '&[aria-expanded="true"]': {
      backgroundColor: palette.components.button.background.tertiary.hover,
      '& .MuiButton-endIcon': { transform: 'rotate(180deg)' },
    },
  }),
  name: {
    minWidth: 0,
  },
  settingsButton: ({ palette }) => ({
    '&[aria-expanded="true"]': {
      backgroundColor: palette.components.button.background.tertiary.hover,
    },
  }),
  icon: {
    width: '1rem',
    height: '1rem',
    fontSize: '1rem',
  },
  // ArrowDownIcon sets fill on its svg; a CSS fill wins over it and dims with the button
  chevron: ({ palette }) => ({
    fontSize: '1rem',
    fill: palette.icon.default,
    '.Mui-disabled &': { fill: palette.icon.disabled },
  }),
});

export default ChatModelButton;
